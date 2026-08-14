# Managing Events

The preferred source is version 1.3.0 or newer of the HATOF Events WordPress plugin in `wordpress-plugin/hatof-events`. When the plugin is active, the page loads published events from WordPress automatically.

If the WordPress endpoint is unavailable, the page falls back to `assets/data/events.json`.

Upcoming and past events are stored in `assets/data/events.json`.

Each event uses this structure:

```json
{
  "title": "Community Climate Dialogue",
  "startDate": "2026-09-24T09:00:00+00:00",
  "endDate": "2026-09-24T13:00:00+00:00",
  "eventType": "Conference",
  "region": "Africa",
  "location": "Accra, Ghana",
  "summary": "A short description of the event.",
  "image": "/assets/images/events/community-climate-dialogue.jpg",
  "registrationUrl": "https://example.com/registration-page"
}
```

Supported event types are `Conference`, `Online Event`, `Summit`, `Webinar`, and `Workshop`. Supported regions are `Africa`, `North America`, and `Global`.

Use an ISO 8601 date with an explicit timezone offset. The page automatically separates upcoming and past events, sorts them, and hides invalid entries.
