---
title: "Card"
summary: |
  /api/card endpoints.
---

# Card

/api/card endpoints.

## `DELETE /api/card/:card-id/public_link`

Delete the publicly-accessible link to this Card.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

## `DELETE /api/card/:id`

Hard delete a Card. To soft delete, use `PUT /api/card/:id`.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

## `GET /api/card/`

Get all the Cards. Option filter param `f` can be used to change the set of Cards that are returned; default is
  `all`, but other options include `mine`, `bookmarked`, `database`, `table`, `using_model`, `using_metric`,
  `using_segment`, and `archived`. See corresponding implementation functions above for the specific behavior
  of each filter option. :card_index.

### PARAMS:

-  **`f`** nullable enum of archived, table, using_model, bookmarked, using_segment, all, mine, using_metric, database.

-  **`model_id`** nullable value must be an integer greater than zero.

## `GET /api/card/:card-id/params/:param-key/search/:query`

Fetch possible values of the parameter whose ID is `:param-key` that contain `:query`.

    ;; fetch values for Card 1 parameter 'abc' that contain 'Orange';
     GET /api/card/1/params/abc/search/Orange

  Currently limited to first 1000 results.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

-  **`param-key`** value must be a non-blank string.

-  **`query`** value must be a non-blank string.

## `GET /api/card/:card-id/params/:param-key/values`

Fetch possible values of the parameter whose ID is `:param-key`.

    ;; fetch values for Card 1 parameter 'abc' that are possible
    GET /api/card/1/params/abc/values.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

-  **`param-key`** value must be a non-blank string.

## `GET /api/card/:id`

Get `Card` with ID.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

-  **`ignore_view`** nullable boolean.

-  **`context`** nullable enum of :collection.

## `GET /api/card/:id/dashboards`

Get a list of `{:name ... :id ...}` pairs for all the dashboards this card appears in.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

## `GET /api/card/:id/query_metadata`

Get all of the required query metadata for a card.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

## `GET /api/card/:id/series`

Fetches a list of comptatible series with the card with id `card_id`.

  - `last_cursor` with value is the id of the last card from the previous page to fetch the next page.
  - `query` to search card by name.
  - `exclude_ids` to filter out a list of card ids.

### PARAMS:

-  **`id`** integer.

-  **`last_cursor`** nullable value must be an integer greater than zero.

-  **`query`** nullable value must be a non-blank string.

-  **`exclude_ids`** nullable function.

## `GET /api/card/:id/timelines`

Get the timelines for card with ID. Looks up the collection the card is in and uses that.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

-  **`include`** nullable must equal events.

-  **`start`** nullable value must be a valid date string.

-  **`end`** nullable value must be a valid date string.

## `GET /api/card/embeddable`

Fetch a list of Cards where `enable_embedding` is `true`. The cards can be embedded using the embedding endpoints
  and a signed JWT.

## `GET /api/card/public`

Fetch a list of Cards with public UUIDs. These cards are publicly-accessible *if* public sharing is enabled.

## `POST /api/card/`

Create a new `Card`. Card `type` can be `question`, `metric`, or `model`.

### PARAMS:

-  **`entity_id`** nullable value must be a non-blank string.

-  **`visualization_settings`** Value must be a map.

-  **`parameters`** nullable sequence of parameter must be a map with :id and :type keys.

-  **`dashboard_id`** nullable value must be an integer greater than zero.

-  **`description`** nullable value must be a non-blank string.

-  **`collection_position`** nullable value must be an integer greater than zero.

-  **`result_metadata`** nullable value must be an array of valid results column metadata maps.

-  **`collection_id`** nullable value must be an integer greater than zero.

-  **`name`** value must be a non-blank string.

-  **`type`** nullable enum of :question, :metric, :model.

-  **`cache_ttl`** nullable value must be an integer greater than zero.

-  **`dataset_query`** Value must be a map.

-  **`parameter_mappings`** nullable sequence of parameter_mapping must be a map with :parameter_id and :target keys.

-  **`display`** value must be a non-blank string.

## `POST /api/card/:card-id/persist`

Mark the model (card) as persisted. Runs the query and saves it to the database backing the card and hot swaps this
  query in place of the model's query.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

## `POST /api/card/:card-id/public_link`

Generate publicly-accessible links for this Card. Returns UUID to be used in public links. (If this Card has
  already been shared, it will return the existing public link rather than creating a new one.)  Public sharing must
  be enabled.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

## `POST /api/card/:card-id/query`

Run the query associated with a Card.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

-  **`parameters`** 

-  **`ignore_cache`** nullable boolean.

-  **`dashboard_id`** nullable value must be an integer greater than zero.

-  **`collection_preview`** nullable boolean.

## `POST /api/card/:card-id/query/:export-format`

Run the query associated with a Card, and return its results as a file in the specified format.

  `parameters` should be passed as query parameter encoded as a serialized JSON string (this is because this endpoint
  is normally used to power 'Download Results' buttons that use HTML `form` actions).

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

-  **`export-format`** enum of csv, api, xlsx, json.

-  **`parameters`** nullable value must be a valid JSON string.

-  **`pivot_results`** nullable value must be a valid boolean string ('true' or 'false').

-  **`format_rows`** nullable value must be a valid boolean string ('true' or 'false').

## `POST /api/card/:card-id/refresh`

Refresh the persisted model caching `card-id`.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

## `POST /api/card/:card-id/unpersist`

Unpersist this model. Deletes the persisted table backing the model and all queries after this will use the card's
  query rather than the saved version of the query.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

## `POST /api/card/:id/copy`

Copy a `Card`, with the new name 'Copy of _name_'.

### PARAMS:

-  **`id`** nullable value must be an integer greater than zero.

## `POST /api/card/collections`

Bulk update endpoint for Card Collections. Move a set of `Cards` with `card_ids` into a `Collection` with
  `collection_id`, or remove them from any Collections by passing a `null` `collection_id`.

### PARAMS:

-  **`card_ids`** sequence of value must be an integer greater than zero.

-  **`collection_id`** nullable value must be an integer greater than zero.

## `POST /api/card/from-csv`

Create a table and model populated with the values from the attached CSV. Returns the model ID if successful.

### PARAMS:

-  **`raw-params`**

## `POST /api/card/pivot/:card-id/query`

Run the query associated with a Card.

### PARAMS:

-  **`card-id`** value must be an integer greater than zero.

-  **`parameters`** 

-  **`ignore_cache`** nullable boolean.

## `PUT /api/card/:id`

Update a `Card`.

### PARAMS:

-  **`id`** value must be an integer greater than zero.

-  **`delete_old_dashcards`** nullable boolean.

-  **`body`** map where {:name (optional) -> <nullable value must be a non-blank string.>, :parameters (optional) -> <nullable sequence of parameter must be a map with :id and :type keys>, :dataset_query (optional) -> <nullable Value must be a map.>, :type (optional) -> <nullable enum of :question, :metric, :model>, :display (optional) -> <nullable value must be a non-blank string.>, :description (optional) -> <nullable string>, :visualization_settings (optional) -> <nullable Value must be a map.>, :archived (optional) -> <nullable boolean>, :enable_embedding (optional) -> <nullable boolean>, :embedding_params (optional) -> <nullable value must be a valid embedding params map.>, :collection_id (optional) -> <nullable value must be an integer greater than zero.>, :collection_position (optional) -> <nullable value must be an integer greater than zero.>, :result_metadata (optional) -> <nullable value must be an array of valid results column metadata maps.>, :cache_ttl (optional) -> <nullable value must be an integer greater than zero.>, :collection_preview (optional) -> <nullable boolean>, :dashboard_id (optional) -> <nullable value must be an integer greater than zero.>}.

---

[<< Back to API index](../api-documentation.md)