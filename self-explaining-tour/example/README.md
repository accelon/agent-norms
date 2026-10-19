# tour example

A minimal page with a start/settings button, a search input and a result area.

```powershell
# from this directory
bun run ../build-tours.ts --config tour.config.ts
bun run ../build-tours.ts --config tour.config.ts --check
bun build demo.ts --target browser --outfile demo.js
# open demo.html in a browser
```

The tour is `tours/welcome.tour`; the compiler writes `tour-data.ts`.
`demo.ts` shows the minimal `TourApp` adapter and `initTour` call.
