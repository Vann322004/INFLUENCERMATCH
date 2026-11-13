"""Browser checks for the current campaign write contract, preserving the original UI.
Uses isolated API fixtures and never creates a real campaign.
Run: python scripts/verify_campaign_budget.py
"""
import json
import os
from playwright.sync_api import sync_playwright, expect
from urllib.parse import urlparse

BASE = os.environ.get('QUALITY_TEST_BASE_URL', 'http://localhost:5173')
BRAND = '00000000-0000-4000-8000-000000000001'
CAMPAIGN = '00000000-0000-4000-8000-000000000002'
SUGGESTION = {'name': 'Charger review budget test', 'productService': 'GaN charger 65W', 'objective': 'CONVERSION',
              'platforms': ['TIKTOK'], 'niches': ['Technology'], 'targetAudiences': ['18-24'], 'locations': ['nationwide'],
              'totalBudget': 30000000, 'targetCreatorCount': 1, 'brief': 'Review actual charging performance.',
              'followerMin': 10000, 'aiExplanation': 'Review the proposed campaign before saving.'}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for mode in ['create', 'draft', 'error']:
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        page = context.new_page()
        session = {'id': 'budget-check', 'accessToken': 'budget-check-token', 'user': {'id': 'budget-brand', 'role': 'BRAND'}, 'logoutMarker': None}
        page.add_init_script('sessionStorage.setItem("im_tab_auth_session",' + json.dumps(json.dumps(session)) + ');')
        writes = []
        def respond(route):
            req = route.request
            path = urlparse(req.url).path
            if path == '/api/v1/ai/campaign-autofill':
                route.fulfill(json={'data': SUGGESTION})
            elif path == '/api/v1/brands/me':
                route.fulfill(json={'data': {'id': BRAND, 'businessName': 'Test Brand'}})
            elif path == f'/api/v1/brands/{BRAND}/campaigns' and req.method == 'POST':
                payload = req.post_data_json
                writes.append(payload)
                assert 'budgetMin' not in payload and 'budgetMax' not in payload
                assert payload['totalBudget'] == 30000000
                assert payload['currency'] == 'VND'
                assert payload['targetCreatorCount'] == 1 and payload['creatorMode'] == 'SINGLE'
                assert payload['brief'] == SUGGESTION['brief'] and 'description' not in payload
                route.fulfill(status=500 if mode == 'error' else 200,
                              json={'detail': 'Budget test API failure'} if mode == 'error' else {'data': {**payload, 'id': CAMPAIGN, 'brandId': BRAND, 'status': 'DRAFT'}})
            else:
                route.fulfill(json={'data': []})
        page.route('**/api/v1/**', respond)
        page.goto(BASE + '/campaigns/create')
        expect(page.locator('.ccreate-ai-hero-card')).to_be_visible()
        page.locator('.ccreate-ai-input-field').fill('Find creators to review a GaN charger with a 30 million VND budget.')
        page.locator('.ccreate-ai-action-btn').click()
        expect(page.locator('.ai-highlight-card')).to_be_visible()
        if mode == 'draft':
            page.locator('.ccreate-btn-draft').click()
            expect(page).to_have_url(BASE + '/campaign-management?tab=draft')
        else:
            page.locator('.ccreate-btn-next').click()
            expect(page.locator('.ccreate-step-item.active .ccreate-step-num')).to_have_text('2')
            page.locator('.ccreate-btn-next').click()
            expect(page.locator('.ccreate-step-item.active .ccreate-step-num')).to_have_text('3')
            page.locator('.ccreate-btn-next').click()
            if mode == 'error':
                expect(page.get_by_text('Budget test API failure', exact=True)).to_be_visible()
                expect(page).to_have_url(BASE + '/campaigns/create')
            else:
                expect(page).to_have_url(BASE + '/creators?autoRun=true')
        assert len(writes) == 1
        print(f'Original UI {mode}: totalBudget/brief/creator count sent correctly; no legacy fields or false success: PASS')
        context.close()
    browser.close()
