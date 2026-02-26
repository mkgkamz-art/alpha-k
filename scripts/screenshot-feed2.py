from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # Scroll down to see whale/signal cards
    for i in range(8):
        page.evaluate("window.scrollBy(0, 600)")
        page.wait_for_timeout(300)

    page.wait_for_timeout(1000)
    page.screenshot(path="screenshot-feed-whale.png")
    print("Scrolled screenshot saved")

    # Scroll more
    for i in range(8):
        page.evaluate("window.scrollBy(0, 600)")
        page.wait_for_timeout(300)

    page.wait_for_timeout(1000)
    page.screenshot(path="screenshot-feed-signal.png")
    print("More scrolled screenshot saved")

    browser.close()
