class App {
    constructor() {
        console.log('App initialized');
        this.init();
    }

    private init(): void {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '<h1>TypeScript Web Project</h1>';
            console.log('DOM updated');
        }
    }
}

new App(); 