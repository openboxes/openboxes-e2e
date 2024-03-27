import { Page } from "@playwright/test";

class Navigation {
    private page: Page;

    private URL_PREFIX = "/openboxes";

    constructor(page: Page) {
        this.page = page;
    }

    private buildURL(path: string) {
        return `${this.URL_PREFIX}${path}`;
    }

    async goToHome() {
        await this.page.goto(this.buildURL("/"));
    }

    async goToDashboard() {
        await this.page.goto(this.buildURL("/dashboard"));
    }
}

export default Navigation;
