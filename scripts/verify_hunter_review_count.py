"""Regression check: failed crawl count must never become quality pending count.

Uses isolated API fixtures with Playwright; no deployed data is changed.
Run: python scripts/verify_hunter_review_count.py
"""
import json
import os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

base = os.environ.get('QUALITY_TEST_BASE_URL', 'http://localhost:5173')
user = {'id': 'count-test-manager', 'role': 'DATA_MANAGER'}
item = {'metricId': '00000000-0000-4000-8000-000000000001', 'creatorId': '10000000-0000-4000-8000-000000000001',
        'platform': 'TIKTOK', 'userName': 'pending_review', 'displayName': 'Pending Review', 'niche': 'Skincare',
        'profileUrl': 'https://www.tiktok.com/@pending_review', 'contentSummary': 'Review content',
        'dataConfidence': 0.4, 'collectedAt': '2026-11-13T10:00:00'}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for pending_count in [0, 1]:
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        session = {'id': 'count-test-session', 'accessToken': 'count-test-token', 'user': user, 'logoutMarker': None}
        page.add_init_script('sessionStorage.setItem("im_tab_auth_session",' + json.dumps(json.dumps(session)) + ');')
        requests = []
        def respond(route):
            request = route.request
            path = urlparse(request.url).path
            requests.append((request.method, path))
            if path.endswith('/crawl/batch-crawl'):
                route.fulfill(json={'summary': {'total_requested': 1, 'failed_count': 1}, 'results': []})
            elif path == '/api/v1/data/crawl-fields':
                route.fulfill(json={'data': [{'id': 'beauty', 'name': 'Skincare', 'active': True, 'keywords': ['skincare']}]})
            elif path == '/api/v1/data/quality/pending':
                route.fulfill(json={'data': {'items': [item] if pending_count else [], 'page': 0, 'size': 10,
                                            'totalElements': pending_count, 'totalPages': pending_count}})
            elif path == '/api/v1/taxonomies/niches':
                route.fulfill(json={'data': ['Skincare']})
            else:
                route.fulfill(json={'data': []})
        page.route('**/api/v1/**', respond)
        page.goto(base + '/data-manager/jobs')
        start = page.get_by_role('button', name='Bắt đầu săn KOC tự động')
        expect(start).to_be_enabled()
        start.click()
        expect(page.get_by_text('Có 1 kênh cào lỗi hoặc chưa đạt bộ lọc Tier-0', exact=True)).to_be_visible()
        quality = page.get_by_role('button', name=f'Kiểm định chất lượng ({pending_count})')
        expect(quality).to_be_visible()
        quality.click()
        expect(page).to_have_url(base + '/data-manager/data-quality')
        if pending_count:
            expect(page.get_by_text('Pending Review', exact=True)).to_be_visible()
        else:
            expect(page.get_by_text('Không có hồ sơ đang chờ kiểm định', exact=True)).to_be_visible()
        assert ('GET', '/api/v1/data/quality/pending') in requests
        assert not errors, errors
        print(f'Failed crawl=1, deployed review pending={pending_count}: matching navigation count PASS')
        context.close()
    browser.close()
