// Dans votre script.js global

document.addEventListener('DOMContentLoaded', function() {
    // Menu Mobile Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle-custom');
    const mobileNav = document.querySelector('.mobile-nav-custom');

    if (menuToggle && mobileNav) {
        if (!mobileNav.id) {
            mobileNav.id = 'mobileNavMenuGlobal'; // ID par défaut pour ARIA
        }
        menuToggle.setAttribute('aria-controls', mobileNav.id);
        menuToggle.setAttribute('aria-expanded', 'false');

        if (!menuToggle.dataset.listenerAttached) {
            menuToggle.addEventListener('click', function() {
                this.classList.toggle('active');
                mobileNav.classList.toggle('active');
                const isExpanded = this.classList.contains('active');
                this.setAttribute('aria-expanded', isExpanded.toString());
            });
            menuToggle.dataset.listenerAttached = 'true';

            mobileNav.querySelectorAll('a').forEach(link => {
                if (!link.dataset.listenerAttached) {
                    link.addEventListener('click', () => {
                        if (mobileNav.classList.contains('active')) {
                            menuToggle.click();
                        }
                    });
                    link.dataset.listenerAttached = 'true';
                }
            });
        }
    }

    // Positionnement de la barre de navigation des services
    const headerSite = document.querySelector('.site-header-custom');
    const servicesNavBar = document.querySelector('.services-navigation-bar');
    function positionServicesNav() {
        if (headerSite && servicesNavBar) {
            const headerHeight = headerSite.offsetHeight;
            servicesNavBar.style.top = headerHeight + 'px';
        }
    }
    if (servicesNavBar) {
        positionServicesNav();
        window.addEventListener('resize', positionServicesNav);
        // Assurer que la barre de service est repositionnée après le chargement complet du DOM et des styles
        // Cela peut être utile si la hauteur du header change dynamiquement (ex: chargement de polices)
        window.addEventListener('load', positionServicesNav);
    }


    // Année du Footer (POUR TOUTES LES PAGES)
    const currentYearSpans = document.querySelectorAll('.current-year-proxatek');
    if (currentYearSpans.length > 0) {
        const year = new Date().getFullYear().toString();
        currentYearSpans.forEach(span => {
            if (span.textContent !== year) {
                span.textContent = year;
            }
        });
    }


    // --- FAQ Interaction (POUR TOUTES LES PAGES) ---
    const faqAllItems = document.querySelectorAll('.faq-service dt, .faq-metier dt');

    faqAllItems.forEach((item, index) => {
        const answer = item.nextElementSibling;
        let answerId;

        if (answer && answer.tagName === 'DD') {
            if (!answer.id) {
                // Tente de créer un ID plus unique basé sur la classe du parent <dl> et l'index
                const parentDlClass = item.closest('dl') ? item.closest('dl').className.split(' ')[0] : 'faq-generic'; // Prend la première classe de dl
                answerId = `faq-answer-${parentDlClass}-${index + 1}`;
                answer.id = answerId;
            } else {
                answerId = answer.id;
            }
            item.setAttribute('aria-controls', answerId);
        }
        item.setAttribute('aria-expanded', 'false');


        if (!item.dataset.faqListenerAttached) {
            item.addEventListener('click', function () {
                const isActive = this.classList.toggle('active');
                this.setAttribute('aria-expanded', isActive.toString());
                const controlledAnswer = this.nextElementSibling;
                if (controlledAnswer && (controlledAnswer.tagName === 'DD')) {
                    controlledAnswer.classList.toggle('active');
                }
            });
            item.dataset.faqListenerAttached = 'true';
        }
    });
});