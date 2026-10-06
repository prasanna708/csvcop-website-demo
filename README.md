# CSVCOP website: complete demo for review

The whole CSVCOP website, rebuilt for review before any of it goes into the live site:

- **Home**, **Products** (new), **Overview**, **Features**, **Pricing**, **FAQ** and **Contact**, linked to each other only.
- The two modules, 21 CFR Part 11 Controls and Micro-segmentation, with equal weight on every page.
- Real screenshots of the CSVCOP application, showing a sample HPLC workstation (no customer data).
- Motion: entrance on load, sections that reveal as you scroll, a sticky product tour, screenshot galleries, animated module drawings, marquees and a reading-progress bar. All of it is switched off for visitors who ask their system for less motion.

This demo is not the live site: Login and the contact form only say what the live site would do, and the pages ask search engines not to index them.

Plain HTML, CSS and JavaScript. `python source/build.py` writes the seven pages from `source/` (the shared frame in `shell.html`, each page's contents in `pages/`, repeated pieces in `partials/`).
