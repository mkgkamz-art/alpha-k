from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # Find the scrollable container and scroll to where WHALE cards are
    scroll_js = """
    const containers = document.querySelectorAll('[class*="overflow-y"]');
    for (const c of containers) {
        if (c.scrollHeight > c.clientHeight) {
            // Scroll to bottom to find whale cards
            c.scrollTop = c.scrollHeight;
            break;
        }
    }
    """
    page.evaluate(scroll_js)
    page.wait_for_timeout(3000)  # Wait for infinite scroll to load more
    page.screenshot(path="screenshot-feed-bottom2.png")
    print("Bottom screenshot saved")

    # Also find the first WHALE badge and scroll to it
    whale_el = page.locator("text=WHALE").first
    if whale_el.count() > 0:
        whale_el.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        page.screenshot(path="screenshot-feed-whale2.png")
        print("Whale card screenshot saved")
    else:
        print("No WHALE element found")

    browser.close()
