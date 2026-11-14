# yash@halbhavi

Personal site: plain HTML, CSS and a little JavaScript. No build step and no dependencies.

| Page | File | Concept |
|---|---|---|
| Landing | `index.html` | L3 Topology: interactive network map |
| About | `about.html` | A1 Traceroute: timeline as network hops |
| Projects | `projects.html` | P3 Spec sheets: filterable, each opens a full sheet |
| Connect | `connect.html` | C1 Handshake: form opens your email app |

- Styles: `assets/css/site.css` (colours are tokens at the top)
- Behaviour: `assets/js/site.js`
- Photos: `assets/img/` (navy duotone versions)
- Résumé: `assets/yash-halbhavi-resume.pdf`

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Deploy (GitHub Pages)

1. Create a repo (for example `Batyoki.github.io`) and push these files to `main`.
2. In the repo, go to Settings → Pages, pick "Deploy from a branch", then `main` / root.

## Editing

- **New project:** copy one `<button class="sheet">` block in `projects.html`, give it a new `data-id` and `data-area`, and edit its `<template>`.
- **Linking a project from the landing map:** use `href="projects.html#<data-id>"`.
- **Filtering from a link:** `projects.html#robotics` (or `finance`, `networks`, `systems`).
