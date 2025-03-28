(ns metabase.events.schema
  (:require
   [malli.core :as mc]
   [malli.util :as mut]
   [metabase.models.view-log-impl :as view-log-impl]
   [metabase.util.malli.schema :as ms]
   [toucan2.core :as t2]))

#_{:clj-kondo/ignore [:unused-private-var]}
(defn- with-hydrate
  "Given a malli entry schema of a map, return a new entry schema with an additional option
  to hydrate information when sending system event notifications.

    (events.notification/hydrate! [:map
                                    (-> [:user_id :int] (with-hydrate :user [:model/User :email]))]
                                  {:user_id 1})
    ;; => {:user_id 1
           :user    {:email \"ngoc@metabase.com\"}}"
  [entry-schema k model]
  (assert (#{2 3} (count entry-schema)) "entry-schema must have 2 or 3 elements")
  (let [[entry-key option schema] (if (= 2 (count entry-schema))
                                    [(first entry-schema) {} (second entry-schema)]
                                    entry-schema)]
    [entry-key (assoc option :hydrate {:key   k
                                       :model model})
     schema]))

(def ^:private user-hydrate
  [:model/User :first_name :last_name :email])

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id  pos-int?]
                       [:object   [:fn #(t2/instance-of? :model/Collection %)]]])]
  (def ^:private collection-events-schemas
    {:event/collection-read default-schema}))

;; dashboard events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id pos-int?]
                       [:object [:fn #(t2/instance-of? :model/Dashboard %)]]])
      view-only      (mc/schema
                      [:map {:closed true}
                       [:user-id [:maybe pos-int?]]
                       [:object-id [:maybe pos-int?]]])
      with-dashcards (mut/assoc default-schema
                                :dashcards [:sequential [:map [:id pos-int?]]])]
  (def ^:private dashboard-events-schemas
    {:event/dashboard-read         view-only
     :event/dashboard-create       default-schema
     :event/dashboard-update       default-schema
     :event/dashboard-delete       default-schema
     :event/dashboard-remove-cards with-dashcards
     :event/dashboard-add-cards    with-dashcards}))

;; card events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id  [:maybe pos-int?]]
                       [:object   [:fn #(t2/instance-of? :model/Card %)]]])]
  (def ^:private card-events-schemas
    {:event/card-create default-schema
     :event/card-update default-schema
     :event/card-delete default-schema
     :event/card-read   (mc/schema
                         [:map {:closed true}
                          ;; context is deliberately coupled to view-log's context
                          [:context view-log-impl/context]
                          [:user-id [:maybe pos-int?]]
                          [:object-id [:maybe pos-int?]]])
     :event/card-query  [:map {:closed true}
                         [:card-id pos-int?]
                         [:user-id [:maybe pos-int?]]
                         [:context {:optional true} :any]]}))

;; user events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id pos-int?]])]
  (def ^:private user-events-schema
    {:event/user-login   default-schema
     :event/user-joined  default-schema
     :event/user-invited (mc/schema
                          [:map {:closed true}
                           [:object [:map
                                     [:email ms/Email]
                                     [:is_from_setup {:optional true} :boolean]
                                     [:first_name    {:optional true} [:maybe :string]]
                                     [:invite_method {:optional true} :string]
                                     [:sso_source    {:optional true} [:maybe [:or :keyword :string]]]]]
                           [:details {:optional true}
                            [:map {:closed true}
                             [:invitor [:map {:closed true}
                                        [:email                       ms/Email]
                                        [:first_name {:optional true} [:maybe :string]]]]]]])}))

;; metric events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id  pos-int?]
                       [:object   [:fn #(t2/instance-of? :model/LegacyMetric %)]]])
      with-message   (mc/schema [:merge default-schema
                                 [:map {:closed true}
                                  [:revision-message {:optional true} :string]]])]
  (def ^:private metric-related-schema
    {:event/metric-create default-schema
     :event/metric-update with-message
     :event/metric-delete with-message}))

;; segment events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id  pos-int?]
                       [:object   [:fn #(t2/instance-of? :model/Segment %)]]])
      with-message (mc/schema
                    [:merge default-schema
                     [:map {:closed true}
                      [:revision-message {:optional true} :string]]])]
  (def ^:private segment-related-schema
    {:event/segment-create default-schema
     :event/segment-update with-message
     :event/segment-delete with-message}))

;; database events

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:object [:fn #(t2/instance-of? :model/Database %)]]
                       [:previous-object {:optional true} [:fn #(t2/instance-of? :model/Database %)]]
                       [:user-id pos-int?]])]
  (def ^:private database-events
    {:event/database-create default-schema
     :event/database-update default-schema
     :event/database-delete default-schema}))

;; alert schemas
(def ^:private alert-schema
  {:event/alert-create (mc/schema
                        [:map {:closed true}
                         (-> [:user-id pos-int?]
                             (with-hydrate :user user-hydrate))
                         [:object [:and
                                   [:fn #(t2/instance-of? :model/Pulse %)]
                                   [:map
                                    [:card [:fn #(t2/instance-of? :model/Card %)]]]]]])})

;; pulse schemas
(def ^:private pulse-schemas
  {:event/pulse-create (mc/schema
                        [:map {:closed true}
                         [:user-id pos-int?]
                         [:object [:fn #(t2/instance-of? :model/Pulse %)]]])})

;; table events

(def ^:private table-events
  {:event/table-read (mc/schema
                      [:map {:closed true}
                       [:user-id  pos-int?]
                       [:object [:fn #(t2/instance-of? :model/Table %)]]])})

(let [default-schema (mc/schema
                      [:map {:closed true}
                       [:user-id [:maybe pos-int?]]
                       [:object [:maybe [:fn #(boolean (t2/model %))]]]
                       [:has-access {:optional true} [:maybe :boolean]]])]
  (def ^:private permission-failure-events
    {:event/read-permission-failure default-schema
     :event/write-permission-failure default-schema
     :event/update-permission-failure default-schema
     :event/create-permission-failure (mc/schema
                                       [:map {:closed true}
                                        [:user-id [:maybe pos-int?]]
                                        [:model [:or :keyword :string]]])}))

(def topic->schema
  "Returns the schema for an event topic."
  (merge alert-schema
         card-events-schemas
         collection-events-schemas
         dashboard-events-schemas
         database-events
         metric-related-schema
         permission-failure-events
         pulse-schemas
         table-events
         user-events-schema
         segment-related-schema))
