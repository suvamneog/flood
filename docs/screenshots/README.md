# Screenshots

Desktop captures from the live site for the project README.

Regenerate (requires Playwright browsers):

```bash
BASE=https://floodassist-assam.vercel.app
mkdir -p docs/screenshots
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/" docs/screenshots/01-home.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=4500 "$BASE/flood-map" docs/screenshots/03-flood-map.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/districts" docs/screenshots/04-districts.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/relief-camps" docs/screenshots/05-relief-camps.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=2500 "$BASE/emergency" docs/screenshots/06-emergency.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/donate" docs/screenshots/07-donate.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/timeline" docs/screenshots/08-past-reports.png
npx --yes playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$BASE/weather" docs/screenshots/09-river-alerts.png
```

`02-home-intelligence.png` is a scrolled Home viewport (brief / ranking / guidance) and may need a short Playwright script if regenerating.
