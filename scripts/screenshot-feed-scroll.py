from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # Full page screenshot
    page.screenshot(path="screenshot-feed-full.png", full_page=True)
    print("Full page screenshot saved")

    # Check for whale and signal cards in the HTML
    whale_cards = page.locator("text=WHALE").count()
    signal_buy = page.locator("text=BUY").count()
    signal_sell = page.locator("text=SELL").count()
    alert_badges = page.locator("text=ALERT").count()
    print(f"WHALE cards: {whale_cards}")
    print(f"BUY badges: {signal_buy}")
    print(f"SELL badges: {signal_sell}")
    print(f"ALERT badges: {alert_badges}")

    # Scroll to the bottom to check more items
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(2000)
    page.screenshot(path="screenshot-feed-bottom.png")
    print("Bottom screenshot saved")

    browser.close()
