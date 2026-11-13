"""Verify delayed discovery responses never show cached, sample, or stale creator cards.
Uses isolated API fixtures; no real data is changed.
Run: python scripts/verify_discovery_loading.py
"""
import json
import os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('QUALITY_TEST_BASE_URL', 'http://localhost:5173')
BRAND = '00000000-0000-4000-8000-000000000010'
A = '00000000-0000-4000-8000-000000000001'
B = '00000000-0000-4000-8000-000000000002'
campaigns = [{'id': value, 'brandId': BRAND, 'name': name, 'status': 'READY_FOR_DISCOVERY', 'platforms': ['TIKTOK'],
              'objective': 'AWARENESS', 'niches': ['Technology'], 'followerMin': 10000, 'followerMax': 100000}
             for value, name in [(A, 'Campaign A'), (B, 'Campaign B')]]

def creator(name):
    return {'id': name, 'creatorId': name, 'displayName': name, 'userName': name,
            'platform': 'TIKTOK', 'followers': 20000, 'engagementRate': 0.04, 'niche': 'Technology', 'matchScore': 0.91}

def setup(browser):
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    user = {'id': 'discovery-test', 'role': 'BRAND', 'fullName': 'Test Brand'}
    session = {'id': 'discovery-session', 'accessToken': 'discovery-token', 'user': user, 'logoutMarker': None}
    page.add_init_script('sessionStorage.setItem("im_tab_auth_session",' + json.dumps(json.dumps(session)) + ');'
                         + 'localStorage.setItem("IM_DISCOVERY_CREATORS",JSON.stringify([{id:"stale-cache",name:"STALE CACHED CREATOR"}]));'
                         + 'localStorage.setItem("IM_MATCHED_CAMPAIGN",JSON.stringify({id:"wrong-campaign",name:"WRONG CACHED CAMPAIGN"}));'
                         + 'window.seenCreatorCards=[];new MutationObserver(()=>{document.querySelectorAll(".cdiscovery-card").forEach(e=>{window.seenCreatorCards.push(e.innerText)})}).observe(document,{childList:true,subtree:true});')
    state = {'pending': [], 'catalog': 0, 'errors': []}
    page.on('pageerror', lambda error: state['errors'].append(str(error)))
    def respond(route):
        path = urlparse(route.request.url).path
        if path.endswith('/discovery'):
            state['pending'].append((path, route))
        elif path == '/api/v1/brands/me':
            route.fulfill(json={'data': {'id': BRAND, 'businessName': 'Test Brand'}})
        elif path == f'/api/v1/brands/{BRAND}/campaigns':
            route.fulfill(json={'data': {'items': campaigns, 'totalElements': 2}})
        elif path == '/api/v1/campaigns/' + A:
            route.fulfill(json={'data': campaigns[0]})
        elif path == '/api/v1/campaigns/' + B:
            route.fulfill(json={'data': campaigns[1]})
        elif path == '/api/v1/creators':
            state['catalog'] += 1
            route.fulfill(json={'data': [creator('UNRELATED CATALOG CREATOR')]})
        elif path == '/api/v1/taxonomies/niches':
            route.fulfill(json={'data': ['Technology']})
        else:
            route.fulfill(json={'data': []})
    page.route('**/api/v1/**', respond)
    page.goto(BASE + f'/creators?campaignId={A}&autoRun=true', wait_until='domcontentloaded')
    deadline = 100
    while not state['pending'] and deadline:
        page.wait_for_timeout(50)
        deadline -= 1
    assert state['pending'], 'Discovery request did not start'
    assert len(state['pending']) == 1, 'Duplicate initial discovery request'
    expect(page.locator('.cdiscovery-card')).to_have_count(0)
    assert 'STALE CACHED CREATOR' not in page.inner_text('body')
    assert 'WRONG CACHED CAMPAIGN' not in page.inner_text('body')
    return context, page, state

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context, page, state = setup(browser)
    page.wait_for_timeout(1000)
    expect(page.locator('.cdiscovery-card')).to_have_count(0)
    state['pending'][0][1].fulfill(json={'data': {'content': [creator('CORRECT RESULT A')]}})
    expect(page.locator('.cdiscovery-card')).to_have_count(1)
    expect(page.locator('.cdiscovery-card')).to_contain_text('CORRECT RESULT A')
    assert state['catalog'] == 0
    assert all('STALE CACHED CREATOR' not in text and 'UNRELATED CATALOG CREATOR' not in text for text in page.evaluate('window.seenCreatorCards'))
    assert not state['errors'], state['errors']
    print('Delayed API: loading only, then exact results; no cache, sample, catalog or duplicate request: PASS')
    context.close()

    context, page, state = setup(browser)
    state['pending'][0][1].fulfill(json={'data': {'content': []}})
    expect(page.get_by_text('Không tìm thấy KOC phù hợp', exact=True)).to_be_visible()
    expect(page.locator('.cdiscovery-card')).to_have_count(0)
    assert state['catalog'] == 0
    print('Empty AI response stays empty without local matching or fallback creators: PASS')
    context.close()

    context, page, state = setup(browser)
    state['pending'][0][1].fulfill(status=500, json={'detail': 'Discovery unavailable'})
    expect(page.get_by_role('alert').filter(has_text='Discovery unavailable')).to_be_visible()
    expect(page.locator('.cdiscovery-card')).to_have_count(0)
    assert state['catalog'] == 0
    print('API error shows error and never fills a fallback list: PASS')
    context.close()

    context, page, state = setup(browser)
    page.get_by_role('combobox').first.click()
    page.locator('.ant-select-dropdown').get_by_text('Campaign B', exact=True).click()
    deadline = 100
    while len(state['pending']) < 2 and deadline:
        page.wait_for_timeout(50)
        deadline -= 1
    assert len(state['pending']) == 2
    expect(page.locator('.cdiscovery-card')).to_have_count(0)
    state['pending'][1][1].fulfill(json={'data': {'content': [creator('CORRECT RESULT B')]}})
    expect(page.locator('.cdiscovery-card')).to_contain_text('CORRECT RESULT B')
    state['pending'][0][1].fulfill(json={'data': {'content': [creator('STALE RESULT A')]}})
    page.wait_for_timeout(350)
    expect(page.locator('.cdiscovery-card')).to_have_count(1)
    expect(page.locator('.cdiscovery-card')).to_contain_text('CORRECT RESULT B')
    assert all('STALE RESULT A' not in text for text in page.evaluate('window.seenCreatorCards'))
    assert state['catalog'] == 0
    assert not state['errors'], state['errors']
    print('Out-of-order campaign responses cannot replace the newer result: PASS')
    context.close()
    browser.close()
