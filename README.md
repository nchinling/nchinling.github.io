# Personal GitHub Pages Site

A modern, responsive profile site for GitHub Pages that includes:

- Hero intro and profile summary
- Live GitHub stats (public repos, followers, stars)
- Dynamic featured repositories with language filter
- Links to your existing resource page and social profiles

## Publish Steps

1. Push this folder to the repository that powers `https://nchinling.github.io`.
2. In repository settings, enable GitHub Pages from the `main` branch root.
3. Wait for deployment and refresh your site.

## Optional Domain Setup

If you want this site on `www.ngchinling.com`, add a `CNAME` file in the root with this line:

```txt
www.ngchinling.com
```

Then set your DNS records to GitHub Pages according to GitHub documentation.

## Content Personalization

Update these places first:

- `index.html` About section text
- `index.html` Connect links
- `script.js` `username` value if your GitHub username changes

## Notes

The site calls the public GitHub API from the browser. If API rate limits are exceeded, repository cards show a friendly fallback message.
