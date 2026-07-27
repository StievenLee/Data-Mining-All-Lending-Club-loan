// Root.tsx — gerbang sebelum dashboard: tampilkan Landing dulu, App menyusul
// setelah user klik masuk. Tak ada router; App tetap 1 SPA dengan state di URL
// query (?tab=...), jadi "sudah masuk" cukup disimpan di sessionStorage +
// dideteksi dari ada/tidaknya query itu sendiri (deep link langsung ke tab
// tertentu berarti user memang menuju dashboard, jadi landing dilewati).

import { useState } from "react";
import App from "./App";
import Landing from "./pages/Landing";

const ENTERED_KEY = "lc-entered";

function hasDashboardQuery() {
  return new URLSearchParams(window.location.search).has("tab");
}

export default function Root() {
  const [entered, setEntered] = useState(
    () => sessionStorage.getItem(ENTERED_KEY) === "1" || hasDashboardQuery()
  );

  if (!entered) {
    return (
      <Landing
        onEnter={() => {
          sessionStorage.setItem(ENTERED_KEY, "1");
          setEntered(true);
        }}
      />
    );
  }

  return <App />;
}
