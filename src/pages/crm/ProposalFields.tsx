import { Button, Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { Deal } from '../../services/api/dealService';
import type { ProposalForm } from './proposalForm';
export default function ProposalFields({form, deal, initialValues, mutable, busy, onDirty, onFinish}: {form:FormInstance<ProposalForm>; deal:Deal; initialValues:Partial<ProposalForm>; mutable:boolean; busy:boolean; onDirty:()=>void; onFinish:(values:ProposalForm)=>void}) { return (<Form form={form} layout="vertical" initialValues={initialValues} disabled={!mutable || busy} onValuesChange={onDirty} onFinish={onFinish}>
      <div className="contact-form-grid-3">
        <Form.Item name="fee" label="Tổng phí thỏa thuận (VND)" rules={[{ required: true, message: 'Nhập phí hợp tác.' }]}><InputNumber min={1} max={Number.MAX_SAFE_INTEGER} precision={0} controls={false} suffix="₫" style={{ width: '100%' }} formatter={value => value == null ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={value => Number((value ?? '').replace(/\./g, ''))} /></Form.Item>
        <Form.Item name="kpiType" label="KPI cam kết trước khi bắt đầu">
          <Select allowClear placeholder="Không cam kết KPI" onChange={value => { if (!value) form.setFieldValue('kpiTarget', null); }} options={[
            { value: 'VIEWS', label: 'Lượt xem' },
            { value: 'CLICKS', label: 'Lượt nhấp' },
            { value: 'LIKES', label: 'Lượt thích' },
            { value: 'COMMENTS', label: 'Bình luận' },
            { value: 'SHARES', label: 'Lượt chia sẻ' },
          ]} />
        </Form.Item>
        <Form.Item name="kpiTarget" label="Mục tiêu KPI" dependencies={['kpiType']} rules={[({ getFieldValue }) => ({
          validator(_, value) {
            const type = getFieldValue('kpiType');
            if (!type && value == null) return Promise.resolve();
            if (type && Number.isSafeInteger(value) && value > 0) return Promise.resolve();
            return Promise.reject(new Error('Chọn loại KPI và nhập mục tiêu số nguyên dương.'));
          },
        })]}>
          <InputNumber min={1} max={Number.MAX_SAFE_INTEGER} precision={0} controls={false} style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item name="terms" label="Điều khoản hợp tác" rules={[{ required: true, whitespace: true, message: 'Nhập điều khoản hợp tác.' }]}><Input.TextArea rows={2} maxLength={4000} placeholder="Phạm vi công việc, thanh toán, quyền sử dụng nội dung…" /></Form.Item>
      <p>KPI này trở thành cam kết khi hai bên xác nhận proposal. Không cam kết KPI sẽ được lưu là không áp dụng, không quy thành 0.</p>
      <Form.List name="units">{(fields, { add, remove }) => <><h3>Ấn phẩm bàn giao</h3>{fields.map(field => <div className="contact-proposal-unit" key={field.key}>
        <div className="contact-form-grid"><Form.Item name={[field.name, 'creatorId']} label="Kênh" rules={[{ required: true }]}><Select options={deal.channels.map(channel => ({ value: channel.creatorId, label: `${channel.platform} · @${channel.username}` }))} /></Form.Item>
          <Form.Item name={[field.name, 'contentType']} label="Định dạng nội dung" rules={[{ required: true, whitespace: true }]}><Input maxLength={100} placeholder="Ví dụ: Video đánh giá" /></Form.Item>
          <Form.Item name={[field.name, 'quantity']} label="Số lượng" rules={[{ required: true }]}><InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name={[field.name, 'dueAt']} label="Hạn bàn giao (giờ Việt Nam)" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></div>
        <Form.Item name={[field.name, 'checklist']} label="Tiêu chí nghiệm thu — mỗi dòng một tiêu chí" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={2} maxLength={25049} /></Form.Item>
        <div className="contact-form-grid"><Form.Item name={[field.name, 'maxRevisionRounds']} label="Số vòng chỉnh sửa tối đa" rules={[{ required: true }]}><InputNumber min={0} max={10} precision={0} /></Form.Item>{mutable && <Button type="text" danger disabled={busy} onClick={() => remove(field.name)}>Bỏ hạng mục</Button>}</div>
      </div>)}{mutable && <Button disabled={busy || fields.length >= 100} onClick={() => add({ quantity: 1, maxRevisionRounds: 1 })}>Thêm hạng mục</Button>}</>}</Form.List>
    </Form>); }
