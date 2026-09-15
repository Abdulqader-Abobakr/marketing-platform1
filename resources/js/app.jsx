import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import FreelancerLayout from './freelancer_side/Layouts/FreelancerLayout';

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob(
            ['./Pages/**/*.jsx', './company_side/**/*.jsx', './freelancer_side/Pages/**/*.jsx'],
            { eager: true }
        );

        const pagePaths = [
            `./Pages/${name}.jsx`,
            `./freelancer_side/Pages/${name.replace('freelancer/', '')}.jsx`,
            `./company_side/${name.replace('company_side/', '')}.jsx`,
        ];

        for (const pagePath of pagePaths) {
            if (pages[pagePath]) {
                const page = pages[pagePath];

                if (name.startsWith('freelancer/') && page.default.layout === undefined) {
                    page.default.layout = page => <FreelancerLayout>{page}</FreelancerLayout>;
                }

                return page;
            }
        }

        throw new Error(`Page not found: ${name}`);
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});