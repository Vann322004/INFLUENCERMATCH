"""Browser regression checks with isolated API fixtures; never writes to the deployed API.

Requires Python and Playwright with Chromium installed.
Run: python scripts/verify_data_quality.py
Override the frontend URL with QUALITY_TEST_BASE_URL if needed.
"""
import json
import os
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('QUALITY_TEST_BASE_URL', 'http://localhost:5173')
USER = {'id': 'review-test-manager', 'role': 'DATA_MANAGER', 'email': 'review@example.test'}
ROWS = [dict(metricId=f'00000000-0000-4000-8000-{i:012d}', creatorId=f'10000000-0000-4000-8000-{i:012d}',
             platform='TIKTOK', userName=f'creator_{i}', displayName=f'Creator Review {i}',
             niche='Skincare', profileUrl=f'https://www.tiktok.com/@creator_{i}',
             contentSummary='Nội dung thật trong bản thu thập: đánh giá sản phẩm và trải nghiệm sử dụng.',
             dataConfidence=0.43, collectedAt='2026-11-13T10:00:00') for i in range(1, 13)]

def setup(browser, width=1440, status=200):
    context = browser.new_context(viewport={'width': width, 'height': 1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    session = {'id': 'review-test-session', 'accessToken': 'review-test-token', 'user': USER, 'logoutMarker': None}
    page.add_init_script('sessionStorage.setItem("im_tab_auth_session",' + json.dumps(json.dumps(session)) + ');')
    state = {'rows': [dict(row) for row in ROWS], 'writes': [], 'gets': [], 'status': status, 'mutation_status': 200}
    def route_api(route):
        request = route.request
        path = urlparse(request.url).path
        assert not path.startswith('/api/v1/quality/'), 'Old crawler quality API was called'
        if path == '/api/v1/data/quality/pending':
            state['gets'].append(request.url)
            if state['status'] != 200:
                route.fulfill(status=state['status'], json={'detail': 'Test API error'})
                return
            query = parse_qs(urlparse(request.url).query)
            page_index = int(query.get('page', ['0'])[0])
            size = int(query.get('size', ['10'])[0])
            rows = state['rows']
            route.fulfill(json={'data': {'items': rows[page_index * size:(page_index + 1) * size], 'page': page_index,
                                        'size': size, 'totalElements': len(rows), 'totalPages': (len(rows) + size - 1) // size}})
        elif '/data/quality/' in path and request.method == 'PUT':
            state['writes'].append({'path': path, 'body': request.post_data_json})
            if state['mutation_status'] != 200:
                route.fulfill(status=state['mutation_status'], json={'detail': 'Test mutation error'})
                return
            metric_id = path.split('/')[-2]
            state['rows'] = [row for row in state['rows'] if row['metricId'] != metric_id]
            route.fulfill(json={'data': {'metricId': metric_id, 'qualityReviewedAt': '2026-11-13T12:00:00'}})
        elif path == '/api/v1/taxonomies/niches':
            route.fulfill(json={'data': ['Skincare', 'Technology']})
        elif path == '/api/v1/auth/me':
            route.fulfill(json={'data': USER})
        else:
            route.fulfill(json={'data': []})
    page.route('**/api/v1/**', route_api)
    page.goto(BASE + '/data-manager/data-quality')
    page.locator('.quality-review-list').wait_for()
    if status == 200:
        page.get_by_role('button', name='Kiểm định', exact=True).first.wait_for()
    else:
        page.get_by_role('alert').wait_for()
    return context, page, state, errors

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [375, 768, 1024, 1440]:
        context, page, state, errors = setup(browser, width)
        page.wait_for_timeout(350)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Body overflows at {width}'
        clipped = page.locator('.data-quality-page button').evaluate_all('(buttons) => buttons.filter(b => { const r=b.getBoundingClientRect(); return r.left<0 || r.right>innerWidth+1; }).length')
        assert clipped == 0, f'Action buttons clipped at {width}'
        if width == 375:
            page.get_by_role('button', name='Mở menu điều hướng').click()
            expect(page.get_by_role('dialog', name='Điều hướng')).to_be_visible()
            page.get_by_role('dialog', name='Điều hướng').get_by_role('button', name='Close').click()
        page.get_by_role('button', name='Kiểm định', exact=True).first.click()
        expect(page.get_by_text('Nội dung đã thu thập', exact=True)).to_be_visible()
        drawer = page.get_by_role('dialog', name='Kiểm định hồ sơ KOC')
        expect(drawer.get_by_role('button', name='Duyệt KOC')).to_be_in_viewport()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Drawer overflows at {width}'
        assert not errors, errors
        print(f'Responsive layout and review drawer {width}px: PASS')
        context.close()

    context, page, state, errors = setup(browser)
    page.get_by_role('button', name='Kiểm định', exact=True).first.click()
    page.get_by_role('button', name='Duyệt KOC').click()
    modal = page.get_by_role('dialog', name='Xác nhận duyệt KOC')
    modal.get_by_role('combobox').fill('Technology')
    modal.get_by_role('button', name='Xác nhận duyệt', exact=True).click()
    expect(modal).not_to_be_visible()
    expect(page.get_by_text('11 hồ sơ', exact=True).first).to_be_visible()
    assert state['writes'] == [{'path': f"/api/v1/data/quality/{ROWS[0]['metricId']}/approve", 'body': {'niche': 'Technology'}}]
    print('Approve uses metricId, PUT and edited niche; reloads list: PASS')
    page.get_by_role('button', name='Kiểm định', exact=True).first.click()
    page.get_by_role('button', name='Từ chối / Phân loại lại').click()
    modal = page.get_by_role('dialog', name='Từ chối hoặc phân loại lại')
    modal.get_by_role('button', name='Xác nhận từ chối', exact=True).click()
    expect(modal.get_by_text('Nhập lý do để lưu kết quả kiểm định.', exact=True)).to_be_visible()
    assert len(state['writes']) == 1
    modal.get_by_role('textbox').fill('Tài khoản bán hàng, không có nội dung đánh giá độc lập.')
    modal.get_by_role('combobox').click()
    page.get_by_text('Tài khoản thương mại / Nhãn hàng', exact=True).click()
    modal.get_by_role('button', name='Xác nhận từ chối', exact=True).click()
    expect(modal).not_to_be_visible()
    assert state['writes'][-1]['path'] == f"/api/v1/data/quality/{ROWS[1]['metricId']}/reject"
    assert state['writes'][-1]['body']['reclassifiedType'] == 'BRAND'
    assert state['writes'][-1]['body']['reason'].startswith('Tài khoản bán hàng')
    assert not errors, errors
    print('Reject requires reason, persists classification with metricId: PASS')
    context.close()

    for status in [403, 404, 500]:
        context, page, state, errors = setup(browser, status=status)
        expect(page.get_by_role('alert')).to_be_visible()
        expect(page.get_by_text('Không có hồ sơ đang chờ kiểm định', exact=True)).not_to_be_visible()
        state['status'] = 200
        page.get_by_role('button', name='Thử lại', exact=True).click()
        page.get_by_role('button', name='Kiểm định', exact=True).first.wait_for()
        assert not errors, errors
        print(f'API error {status} and retry recovery: PASS')
        context.close()

    context, page, state, errors = setup(browser)
    state['mutation_status'] = 409
    page.get_by_role('button', name='Kiểm định', exact=True).first.click()
    page.get_by_role('button', name='Duyệt KOC').click()
    page.get_by_role('dialog', name='Xác nhận duyệt KOC').get_by_role('button', name='Xác nhận duyệt', exact=True).click()
    expect(page.get_by_role('dialog', name='Xác nhận duyệt KOC')).not_to_be_visible()
    expect(page.get_by_text('Hồ sơ đã được xử lý hoặc có dữ liệu mới. Danh sách sẽ được tải lại.', exact=True)).to_be_visible()
    assert not errors, errors
    print('Stale snapshot 409 triggers refresh, no false success: PASS')
    context.close()
    browser.close()
