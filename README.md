# Edirom Annotation View Web Component

## Overview

The `edirom-annotation-view` is a Web Component used within the Edirom system to display a list of annotations and their individual detail views. It renders annotations from structured JSON data, supporting navigation between a list page and a single-annotation detail page with source previews.

It supports two layout modes: `desktop` and `mobile`. In `desktop` mode annotations are presented as a table; in `mobile` mode they appear as tappable cards with a detail view that includes source image or text previews.

## Features

- **Two-Page Navigation**: Switches between an annotation list page (`annotations`) and a single annotation detail page (`annotation`).
- **Responsive Layout**: `desktop` mode renders a structured table; `mobile` mode renders cards with a detail view including source previews.
- **Subset Filtering**: A subset of the full annotations list can be injected and optionally locked, so only the subset is displayed regardless of the full dataset.
- **Image Server Support**: Annotation previews support both IIIF (OpenSeadragon) and Digilib image server URL formats.
- **Scroll Restoration**: Restores the scroll position of the annotations list when navigating back from the detail view.
- **Back Navigation Hook**: Listens for a `back-request` event from the host application and intercepts it to navigate from the detail page back to the list.

## Endpoints (Attributes and Properties)

### `annotations-data` (Attribute / Property)

The full list of annotations to display on the list page. Expects a JSON string (as an attribute) or a JavaScript array (as a property).

**Expected Value Template:**

```json
[
  {
    "id": "annotation-1",
    "pos": "1",
    "title": "Annotation title",
    "categories": "Category A",
    "priority": "1",
    "sigla": "Q1"
  }
]
```

- `id`: Unique identifier for the annotation.
- `pos`: Position label (e.g., measure number or sequential index) displayed in the left column of each card.
- `title`: Annotation title shown in bold.
- `categories`: Category string displayed in the details row.
- `priority`: Priority level shown in the details row.
- `sigla`: Source siglum(s) shown alongside a document icon.

---

### `annotation-data` (Attribute / Property)

The data for a single annotation to display on the detail page. Expects a JSON string (as an attribute) or a JavaScript object (as a property).

**Expected Value Template:**

```json
{
  "title": "Annotation title",
  "categories": "Category A",
  "priority": "1",
  "sigla": "Q1",
  "text": "<p>Annotation body text, may contain HTML.</p>",
  "previews": [
    {
      "siglum": "Q1",
      "source": "Source name",
      "label": "m. 5",
      "type": "image",
      "digilibBaseParams": "https://image-server.example.org/iiif/3/image-id",
      "hiddenData": { "x": 100, "y": 200, "width": 300, "height": 150 }
    },
    {
      "siglum": "Q2",
      "source": "Source name",
      "label": "m. 5",
      "type": "text",
      "content": "<p>Text content rendered as HTML.</p>"
    }
  ]
}
```

- `text`: Annotation body rendered as HTML.
- `previews`: Array of source preview objects.
  - `type`: `"image"` to render an image preview, `"text"` to render HTML content.
  - For `image` type with `openseadragon` (IIIF): provide `digilibBaseParams` (IIIF base URL) and `hiddenData` (`x`, `y`, `width`, `height` for the image region).
  - For `image` type with `digilib`: provide `digilibBaseParams` (base URL with query params) and `digilibSizeParams` (region/size parameters).
  - For `text` type: provide `content` (HTML string).

---

### `layout-mode` (Attribute / Property)

Controls the layout and rendering of the component.

**Possible Values:**

- `desktop` (default): Renders the annotations list as a plain HTML table with columns for Nr., Titel, Kategorien, Priorität, and Quelle.
- `mobile`: Renders the annotations list as tappable cards and includes a full annotation detail view with source previews.

---

### `current-page` (Attribute / Property)

Controls which page is currently displayed. The attribute is kept in sync with the internal state and can be set externally to navigate programmatically.

**Possible Values:**

- `annotations` (default): Shows the annotation list.
- `annotation`: Shows the single annotation detail view (uses the current `annotation-data`).

---

### `annotations-data-subset` (Attribute / Property)

An optional filtered subset of `annotations-data` to display instead of the full list. Expects the same JSON structure as `annotations-data`. Takes effect only when `subset-lock` is `locked`.

---

### `subset-lock` (Attribute / Property)

Controls whether the `annotations-data-subset` is used instead of the full `annotations-data`.

**Possible Values:**

- `unlocked` (default): Always displays the full `annotations-data`.
- `locked`: Displays only the `annotations-data-subset` if it is set.

Whenever `subsetLockState` changes, a [`subset-lock-changed`](#subset-lock-changed) event is dispatched.

---

### `subsetLockState` (Read-only Property)

Returns the resolved lock state, taking into account whether `annotations-data-subset` is available.

**Possible Values:**

- `null`: No `annotations-data-subset` is set. The lock state is irrelevant.
- `'unlocked'`: A subset is set, but the full `annotations-data` is currently displayed.
- `'locked'`: A subset is set and it is currently the active data source.

**Example:**

```javascript
const view = document.querySelector('edirom-annotation-view');
console.log(view.subsetLockState); // null | 'unlocked' | 'locked'
```

---

### `image-server` (Attribute / Property)

Specifies the image server type used to construct preview image URLs on the annotation detail page.

**Possible Values:**

- `openseadragon` (default): Builds IIIF Image API URLs in the format `{baseUrl}/{x},{y},{width},{height}/600,/0/default.jpg`.
- `digilib`: Builds Digilib URLs in the format `{digilibBaseParams}dw=600&dh=600{digilibSizeParams}`.

---

## Events

### `annotation-selected`

Dispatched (in `mobile` mode) when the user taps an annotation card in the list.

**Event Detail:**

```javascript
{
  annotationData: {
    /* annotation object */
  }
}
```

The host application typically responds by setting `annotation-data` on the component and switching `current-page` to `annotation`.

**Example:**

```javascript
document
  .querySelector("edirom-annotation-view")
  .addEventListener("annotation-selected", (e) => {
    const nav = e.target;
    nav.setAttribute(
      "annotation-data",
      JSON.stringify(e.detail.annotationData),
    );
    nav.setAttribute("current-page", "annotation");
  });
```

---

### `subset-lock-changed`

Dispatched whenever [`subsetLockState`](#subsetlockstate-read-only-property) changes. This covers all meaningful transitions: subset data becoming available or being cleared, and the lock being toggled while subset data is present.

The event is **not** fired on initial mount. It is also **not** fired when `subset-lock` changes while no `annotations-data-subset` is set — `subsetLockState` stays `null` in that case, so nothing changed.

The detail value always mirrors [`subsetLockState`](#subsetlockstate-read-only-property) at the moment the event fires.

**Event Detail:**

```javascript
{ value: null | 'locked' | 'unlocked' }
```

- `'locked'`: The subset is now the active data source.
- `'unlocked'`: The full dataset is now the active data source, but `annotations-data-subset` is still set.
- `null`: The full dataset is now the active data source and `annotations-data-subset` has been cleared.

**Example:**

```javascript
document
  .querySelector("edirom-annotation-view")
  .addEventListener("subset-lock-changed", (e) => {
    console.log("Data source changed:", e.detail.value);
    // 'locked'   → subset is now active
    // 'unlocked' → full dataset is active, subset data still present
    // null       → full dataset is active, subset data was cleared
  });
```

---

### `back-request` (Consumed)

This event is **listened for** by the component (not dispatched by it). When the host application dispatches a `back-request` event and the component is on the `annotation` detail page, it calls `event.preventDefault()` and navigates back to the `annotations` list page instead. If already on the list page, the event propagates normally.

---

## Dependencies

### `edirom-icon`

The `edirom-annotation-view` depends on the `edirom-icon` Web Component from the [Edirom Core Web Components](https://github.com/Edirom/edirom-core-web-components). It uses `edirom-icon` to render the document icon (`description`) next to the source siglum in both the annotation list cards and the detail view.

Ensure that the `edirom-icon` component is registered and available in your environment for the component to render correctly.

---

## Usage Example

```html
<edirom-annotation-view
  layout-mode="mobile"
  image-server="openseadragon"
  annotations-data='[{"id":"a1","pos":"1","title":"My Note","categories":"Harmony","priority":"1","sigla":"Q1"}]'
>
</edirom-annotation-view>

<script>
  const view = document.querySelector("edirom-annotation-view");

  view.addEventListener("annotation-selected", (e) => {
    // Fetch full annotation data from your backend, then display the detail page
    view.setAttribute(
      "annotation-data",
      JSON.stringify(e.detail.annotationData),
    );
    view.setAttribute("current-page", "annotation");
  });

  // To navigate back from detail to list (e.g. from a back button):
  document.querySelector("#back-button").addEventListener("click", () => {
    view.dispatchEvent(new CustomEvent("back-request", { bubbles: true }));
  });
</script>
```
