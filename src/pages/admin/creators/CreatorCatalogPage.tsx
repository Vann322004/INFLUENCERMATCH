import { useCallback, useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Form, Input, Select, Spin, Table, Tabs, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { getStoredUser } from '../../../services/authSession';
import { creatorCatalogService as api } from '../../../services/api/creatorCatalogService';
import type { CatalogMaster, CatalogAccount, CatalogFilters, IdentityEvent, HistoryFilters, VerificationStatus } from '../../../services/api/creatorCatalogService';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import type { AsyncResource } from '../../../hooks/useAsyncResource';
import { auditTimestamp } from '../audit/auditDisplay';
import './CreatorCatalogPage.css';

const platformOptions = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE'].map(value => ({value,label:value}));
const verificationLabels: Record<VerificationStatus,string> = {
 VERIFIED:'Đã xác minh trên InfluencerMatch', UNVERIFIED:'Chưa xác minh',
 LEGACY_UNVERIFIED:'Dữ liệu cũ chưa xác minh', SIMULATED:'Mô phỏng · không phải xác minh thật',
};
const eventLabels: Record<string,string> = {
 CLAIM_MASTER:'Ghi nhận hồ sơ', LINK_ACCOUNT:'Liên kết kênh', LINK_NEW_ACCOUNT:'Liên kết kênh mới',
 REFRESH_ACCOUNT_TOKEN:'Làm mới quyền truy cập', UNLINK_ACCOUNT:'Hủy liên kết kênh', REVOKE_ACCESS:'Thu hồi truy cập',
 CONFLICT_RESOLVED_TRANSFER:'Ghi nhận chuyển quyền trong lịch sử', CONFLICT_REJECTED:'Từ chối tranh chấp',
 SUBMIT_CREATOR_CLAIM:'Gửi yêu cầu nhận kênh', REVIEW_CREATOR_CLAIM:'Xét duyệt nhận kênh',
 REJECT_CREATOR_CLAIM:'Từ chối nhận kênh', REVOKE_CREATOR_CLAIM:'Thu hồi hồ sơ nhận kênh',
 REJECT_CREATOR_INVITATION_OR_OWNERSHIP:'Từ chối liên kết không hợp lệ',
 LINK_META_ACCOUNT:'Liên kết kênh qua Meta', REFRESH_META_VERIFICATION:'Làm mới xác minh Meta',
 LINK_TIKTOK_ACCOUNT:'Liên kết kênh TikTok', REFRESH_TIKTOK_VERIFICATION:'Làm mới xác minh TikTok',
 META_OAUTH_VERIFIED:'Xác minh qua Meta', TIKTOK_OAUTH_VERIFIED:'Xác minh qua TikTok',
};
const uuidRule = { pattern:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, message:'Nhập mã UUID hợp lệ.' };
const text = (value: string | null | undefined) => value || '—';
const methodLabels: Record<string,string> = { META_OAUTH:'OAuth Meta', INSTAGRAM_OAUTH:'OAuth Instagram', TIKTOK_OAUTH:'OAuth TikTok', MANUAL:'Bằng chứng thủ công', MANUAL_CLAIM:'Bằng chứng thủ công' };
const pagination = (data: { page:number; size:number; totalElements:number } | null, change: (page:number,size:number)=>void): TablePaginationConfig => ({
 current:(data?.page ?? 0)+1,pageSize:data?.size ?? 20,total:data?.totalElements ?? 0,
 showSizeChanger:true,pageSizeOptions:[10,20,50,100],showTotal:total=>total.toLocaleString('vi-VN')+' bản ghi',
 onChange:(page,size)=>change(page-1,size),
});
function ResourceNotice<T>({resource}:{resource:AsyncResource<T>}) {
 if(resource.status==='error') return <Alert type="error" showIcon title="Không tải được dữ liệu" description={resource.error} action={<Button onClick={()=>void resource.reload()}>Thử lại</Button>} />;
 if(resource.status==='loading') return <div className="catalog-loading"><Spin /><span>Đang tải dữ liệu…</span></div>;
 return null;
}
function Verification({value}:{value:CatalogAccount['verification']}) {
 if(!value) return <span>Chưa có dữ liệu</span>;
 const label=verificationLabels[value.status];
 return <div><Tag color={value.status==='VERIFIED'?'success':value.status==='SIMULATED'?'warning':'default'}>{label ?? 'Trạng thái chưa hỗ trợ'}</Tag>
 <small>{value.method ? (methodLabels[value.method] ?? value.method) : 'Chưa có phương thức'}</small>
 {value.verifiedAt && <small title={value.verifiedAt}>{auditTimestamp(value.verifiedAt)}</small>}
 {value.evidenceSource && <small>Nguồn: {value.evidenceSource}</small>}
 {value.environment && <small>Môi trường: {value.environment}</small>}</div>;
}
function Summary() {
 const resource=useAsyncResource(api.summary);
 const labels = {totalMasters:'Hồ sơ định danh',claimedChannelsCount:'Kênh đã liên kết',unclaimedChannelsCount:'Kênh chưa liên kết',duplicateCandidatesCount:'Xung đột chờ kiểm tra'};
 return <><ResourceNotice resource={resource} />{resource.status==='success' && resource.data && <div className="catalog-summary">
 {Object.entries(labels).map(([key,label])=><article key={key}><span>{label}</span><strong>{resource.data![key as keyof typeof labels].toLocaleString('vi-VN')}</strong></article>)}
 </div>}</>;
}
function MasterList({onOpen}:{onOpen:(id:string)=>void}) {
 const [form]=Form.useForm();
 const [query,setQuery]=useState<CatalogFilters>({page:0,size:20});
 const load=useCallback(()=>api.masters(query),[query]);
 const resource=useAsyncResource(load);
 const columns:TableColumnsType<CatalogMaster>=[
 {title:'Hồ sơ nhà sáng tạo',key:'master',render:(_,row)=><div><Button type="link" onClick={()=>onOpen(row.id)}>{row.canonicalName || 'Hồ sơ chưa có tên'}</Button><code>{row.id}</code></div>},
 {title:'Trạng thái',dataIndex:'status',render:value=><Tag>{value==='ACTIVE'?'Hoạt động':value==='SUSPENDED'?'Tạm ngừng':text(value)}</Tag>},
 {title:'Kênh liên kết',dataIndex:'accountCount',render:value=>value.toLocaleString('vi-VN')},
 {title:'Kết quả xác minh',key:'verification',render:(_,row)=><div>{Object.entries(row.verificationCounts).length ? Object.entries(row.verificationCounts).map(([status,count])=><Tag key={status}>{verificationLabels[status as VerificationStatus] ?? status}: {count}</Tag>):'Chưa có kênh liên kết'}</div>},
 {title:'Ngày tạo',dataIndex:'createdAt',render:value=><time title={value || undefined}>{auditTimestamp(value)}</time>},
 ];
 return <section>
 <Form form={form} className="catalog-filters" layout="vertical" onFinish={values=>setQuery({page:0,size:query.size,...values})}>
 <Form.Item name="q" label="Tìm hồ sơ"><Input placeholder="Tên, mã hồ sơ hoặc thông tin kênh" maxLength={200} allowClear /></Form.Item>
 <Form.Item name="status" label="Trạng thái"><Select allowClear placeholder="Tất cả" options={[{value:'ACTIVE',label:'Hoạt động'},{value:'SUSPENDED',label:'Tạm ngừng'}]} /></Form.Item>
 <Form.Item name="platform" label="Nền tảng"><Select allowClear placeholder="Tất cả" options={platformOptions} /></Form.Item>
 <Form.Item name="verificationStatus" label="Xác minh"><Select allowClear placeholder="Tất cả" options={Object.entries(verificationLabels).map(([value,label])=>({value,label}))} /></Form.Item>
 <div className="catalog-filter-actions"><Button type="primary" htmlType="submit">Tìm kiếm</Button><Button onClick={()=>{form.resetFields();setQuery({page:0,size:query.size})}}>Đặt lại</Button></div>
 </Form>
 <ResourceNotice resource={resource} />
 {resource.status==='success' && <Table<CatalogMaster> rowKey="id" columns={columns} dataSource={resource.data!.items} scroll={{x:950}} pagination={pagination(resource.data,(page,size)=>setQuery({...query,page,size}))} locale={{emptyText:'Không có hồ sơ phù hợp'}} />}
 </section>;
}
function Accounts({masterId}:{masterId?:string}) {
 const [form]=Form.useForm();
 const [query,setQuery]=useState<CatalogFilters>({page:0,size:20});
 const load=useCallback(()=>masterId ? api.accounts(masterId,{page:query.page,size:query.size}) : api.unclaimed(query),[masterId,query]);
 const resource=useAsyncResource(load);
 const columns:TableColumnsType<CatalogAccount>=[
 {title:'Kênh',key:'channel',render:(_,row)=><div><strong>{row.displayName || row.userName || 'Chưa có tên'}</strong><small>{text(row.userName)}</small><code>{row.creatorId}</code></div>},
 {title:'Nền tảng',dataIndex:'platform'},
 {title:'Mã kênh nền tảng',dataIndex:'externalId',render:value=><code>{text(value)}</code>},
 {title:'Định danh ổn định',dataIndex:'isStableId',render:value=>value===true?'Đã có mã ổn định':'Chưa ổn định'},
 {title:'Nguồn dữ liệu',dataIndex:'sourceType',render:value=>value==='PUBLIC'?'Công khai':value==='AUTHORIZED'?'Đã cấp quyền':text(value)},
 {title:'Xác minh',key:'verification',render:(_,row)=><Verification value={row.verification} />},
 ];
 return <section>
 {!masterId && <><p className="catalog-note">Kênh chưa liên kết với Master không đồng nghĩa kênh chưa có dữ liệu xác minh. Trang này chỉ tra cứu, không chuyển quyền sở hữu.</p>
 <Form form={form} className="catalog-filters" layout="vertical" onFinish={values=>setQuery({page:0,size:query.size,...values})}>
 <Form.Item name="q" label="Tìm kênh"><Input placeholder="Tên hoặc mã kênh" maxLength={200} allowClear /></Form.Item>
 <Form.Item name="platform" label="Nền tảng"><Select allowClear placeholder="Tất cả" options={platformOptions} /></Form.Item>
 <Form.Item name="sourceType" label="Nguồn"><Select allowClear placeholder="Tất cả" options={[{value:'PUBLIC',label:'Công khai'},{value:'AUTHORIZED',label:'Đã cấp quyền'}]} /></Form.Item>
 <Form.Item name="isStableId" label="Định danh"><Select allowClear placeholder="Tất cả" options={[{value:true,label:'Ổn định'},{value:false,label:'Chưa ổn định'}]} /></Form.Item>
 <div className="catalog-filter-actions"><Button type="primary" htmlType="submit">Tìm kiếm</Button><Button onClick={()=>{form.resetFields();setQuery({page:0,size:query.size})}}>Đặt lại</Button></div>
 </Form></>}
 <ResourceNotice resource={resource} />
 {resource.status==='success' && <Table<CatalogAccount> rowKey="creatorId" columns={columns} dataSource={resource.data!.items} scroll={{x:1000}} pagination={pagination(resource.data,(page,size)=>setQuery({...query,page,size}))} locale={{emptyText:masterId?'Hồ sơ chưa liên kết kênh':'Không có kênh phù hợp'}} />}
 </section>;
}
function History({masterId}:{masterId?:string}) {
 const [form]=Form.useForm();
 const [query,setQuery]=useState<HistoryFilters>({page:0,size:20});
 const load=useCallback(()=>api.events({...query,masterId:masterId ?? query.masterId}),[query,masterId]);
 const resource=useAsyncResource(load);
 const columns:TableColumnsType<IdentityEvent>=[
 {title:'Thời gian',dataIndex:'occurredAt',render:value=><time title={value || undefined}>{auditTimestamp(value)}</time>},
 {title:'Sự kiện',dataIndex:'eventType',render:value=><span title={value}>{eventLabels[value] ?? value}</span>},
 {title:'Mã hồ sơ / kênh',key:'identity',render:(_,row)=><div><code>{text(row.masterId)}</code><code>{text(row.creatorId)}</code></div>},
 {title:'Người thực hiện',dataIndex:'actorId',render:value=><code>{text(value)}</code>},
 {title:'Trạng thái / lý do',key:'result',render:(_,row)=><div>{text(row.status)}<small>{text(row.reasonCode)}</small></div>},
 {title:'Nguồn sự kiện',dataIndex:'source',render:value=>value==='IDENTITY_AUDIT'?'Nhật ký định danh':value==='AUDIT_LOG'?'Nhật ký hệ thống':value},
 ];
 return <section>
 <p className="catalog-note">Lịch sử tổng hợp từ các nguồn audit được hỗ trợ. Sự kiện cũ có thể chưa có mã Master; dấu “—” không có nghĩa là không từng liên kết.</p>
 <Form form={form} className="catalog-filters" layout="vertical" onFinish={values=>setQuery({page:0,size:query.size,...values})}>
 {!masterId && <Form.Item name="masterId" label="Mã hồ sơ" rules={[uuidRule]}><Input allowClear /></Form.Item>}
 <Form.Item name="creatorId" label="Mã kênh" rules={[uuidRule]}><Input allowClear /></Form.Item>
 <Form.Item name="actorId" label="Mã người thực hiện" rules={[uuidRule]}><Input allowClear /></Form.Item>
 <Form.Item name="claimId" label="Mã hồ sơ nhận kênh" rules={[uuidRule]}><Input allowClear /></Form.Item>
 <Form.Item name="eventType" label="Sự kiện"><Select allowClear placeholder="Tất cả" options={Object.entries(eventLabels).map(([value,label])=>({value,label}))} /></Form.Item>
 <Form.Item name="from" label="Từ thời gian"><Input type="datetime-local" /></Form.Item>
 <Form.Item name="to" label="Đến thời gian" dependencies={['from']} rules={[({getFieldValue})=>({validator:(_,value)=>!value || !getFieldValue('from') || value>=getFieldValue('from')?Promise.resolve():Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu.'))})]}><Input type="datetime-local" /></Form.Item>
 <div className="catalog-filter-actions"><Button type="primary" htmlType="submit">Áp dụng</Button><Button onClick={()=>{form.resetFields();setQuery({page:0,size:query.size})}}>Đặt lại</Button></div>
 </Form>
 <ResourceNotice resource={resource} />
 {resource.status==='success' && <Table<IdentityEvent> rowKey={row=>row.source+':'+row.sourceId} columns={columns} dataSource={resource.data!.items} scroll={{x:1000}} pagination={pagination(resource.data,(page,size)=>setQuery({...query,page,size}))} locale={{emptyText:'Không có sự kiện phù hợp'}} />}
 </section>;
}
function MasterDetail({id,canHistory}:{id:string;canHistory:boolean}) {
 const load=useCallback(()=>api.master(id),[id]);
 const resource=useAsyncResource(load);
 return <><ResourceNotice resource={resource} />{resource.status==='success' && resource.data && <>
 <Descriptions column={1} items={[
 {key:'name',label:'Tên hồ sơ',children:text(resource.data.canonicalName)},
 {key:'id',label:'Mã hồ sơ',children:<code>{resource.data.id}</code>},
 {key:'user',label:'Mã tài khoản liên kết',children:<code>{text(resource.data.userId)}</code>},
 {key:'status',label:'Trạng thái',children:resource.data.status==='ACTIVE'?'Hoạt động':resource.data.status==='SUSPENDED'?'Tạm ngừng':resource.data.status},
 {key:'count',label:'Số kênh liên kết',children:resource.data.accountCount},
 {key:'created',label:'Ngày tạo',children:auditTimestamp(resource.data.createdAt)},
 ]} />
 <Tabs destroyOnHidden items={[
 {key:'accounts',label:'Kênh liên kết',children:<Accounts masterId={id} />},
 ...(canHistory?[{key:'events',label:'Lịch sử hồ sơ',children:<History masterId={id} />}]:[]),
 ]} />
 </>}</>;
}
export default function CreatorCatalogPage() {
 const permissions=getStoredUser()?.permissions ?? [];
 const canCatalog=permissions.includes('VIEW_CREATOR_MASTER_CATALOG');
 const canHistory=permissions.includes('VIEW_CREATOR_IDENTITY_HISTORY');
 const [selected,setSelected]=useState<string | null>(null);
 const tabs=[
 ...(canCatalog?[{key:'masters',label:'Hồ sơ nhà sáng tạo',children:<MasterList onOpen={setSelected} />},{key:'unclaimed',label:'Kênh chưa liên kết',children:<Accounts />}]:[]),
 ...(canHistory?[{key:'history',label:'Lịch sử định danh',children:<History />}]:[]),
 ];
 return <div className="creator-catalog">
 <header className="catalog-header"><h1>Định danh Nhà sáng tạo</h1><p>Một hồ sơ, các kênh được đối chiếu rõ ràng. Tra cứu thông tin và kết quả xác minh; không thay đổi quyền sở hữu tại đây.</p></header>
 {canCatalog && <Summary />}
 {tabs.length?<div className="catalog-panel"><Tabs destroyOnHidden items={tabs} /></div>:<Alert type="warning" showIcon title="Bạn chưa có quyền tra cứu danh mục hoặc lịch sử định danh." />}
 <Drawer open={!!selected} onClose={()=>setSelected(null)} title="Chi tiết hồ sơ định danh" size="min(1080px, 100vw)" destroyOnHidden className="catalog-detail">
 {selected && <MasterDetail key={selected} id={selected} canHistory={canHistory} />}
 </Drawer>
 </div>;
}
