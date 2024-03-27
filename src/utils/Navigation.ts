import { Page } from "@playwright/test";

class Navigation {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goToHome() {
        await this.page.goto("./");
    }

    async goToDashboard() {
        await this.page.goto("./dashboard");
    }
    
}

export default Navigation;