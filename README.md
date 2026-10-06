# CSVCOP website (demo for review)

The CSVCOP marketing site, redesigned, for review before it replaces the live one.

- **Pages:** Home, Products, How it works, Features, Pricing, FAQ, Contact, and a 404 page, linked only to each other.
- **The two modules side by side:** 21 CFR Part 11 Controls (blue) and Micro-segmentation (teal), with equal weight.
- **Real screens of the CSVCOP application**, shown in 3D:
  - a hero whose windows straighten as you scroll;
  - a rotating carousel;
  - stacks of screens that deal themselves.
  They show a sample HPLC workstation, not customer data.
- **Short copy:** what each module does and the evidence it produces, nothing more.

## Production checklist

- Plain HTML, CSS and JavaScript (`css/site.css`, `js/site.js`, no libraries).
- Screens as lossless WebP with PNG fallback, lazy-loaded, with fixed dimensions.
- Keyboard and screen-reader friendly: a skip link, labelled controls, and a carousel you can drive with the arrow keys.
- Every animation is switched off for visitors who ask their system for less motion.
- Works from 360 px phones to wide desktops, with no sideways scrolling.

## Before this goes live

Remove `<meta name="robots" content="noindex, nofollow">` from `source/shell.html`, point `og:image` at the live domain, and remove the "Demo" badge. The Login button and the contact form then need wiring to the real portal and enquiry endpoint.

## Build

`python source/build.py` writes the pages from `source/`:
- `shell.html` is the frame of every page;
- `pages/` holds each page's content;
- `partials/` holds the repeated pieces;
- `sprite.svg` holds the icons.
