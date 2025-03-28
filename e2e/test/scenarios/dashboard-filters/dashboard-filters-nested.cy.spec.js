import { H } from "e2e/support";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  createNativeQuestion,
  createQuestion,
  createQuestionAndDashboard,
} from "e2e/support/helpers";

const { PRODUCTS_ID } = SAMPLE_DATABASE;

describe("scenarios > dashboard > filters > nested questions", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("POST", "/api/dataset").as("dataset");
    cy.intercept("POST", "/api/dashboard/*/dashcard/*/card/*/query").as(
      "dashcardQuery",
    );
  });

  it("dashboard filters should work on nested question (metabase#12614, metabase#13186, metabase#18113, metabase#32126)", () => {
    const filter = {
      name: "Text Filter",
      slug: "text",
      id: "27454068",
      type: "string/=",
      sectionId: "string",
    };

    createNativeQuestion({
      name: "18113 Source",
      native: {
        query: "select * from products limit 5",
      },
      display: "table",
    }).then(({ body: { id: Q1_ID } }) => {
      const nestedQuestion = {
        name: "18113 Nested",
        query: {
          "source-table": `card__${Q1_ID}`,
        },
      };

      const dashboardDetails = {
        name: "Nested Filters",
        parameters: [filter],
      };

      createQuestionAndDashboard({
        questionDetails: nestedQuestion,
        dashboardDetails,
      }).then(({ body: { dashboard_id } }) => {
        H.visitDashboard(dashboard_id);
      });
    });

    H.editDashboard();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(filter.name).find(".Icon-gear").click();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Select…").click();

    // This part reproduces metabase#13186
    cy.log("Reported failing in v0.36.4 (`Category` is missing)");
    H.popover().within(() => {
      cy.findByText(/Ean/i);
      cy.findByText(/Title/i);
      cy.findByText(/Vendor/i);
      cy.findByText(/Category/i).click();
    });

    H.saveDashboard();

    // Add multiple values (metabase#18113)
    H.filterWidget().click();
    H.popover().within(() => {
      H.fieldValuesInput().type("Gizmo,Gadget").blur();
    });

    cy.button("Add filter").click();
    cy.wait("@dashcardQuery");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("2 selections");
    cy.get("tbody > tr").should("have.length", 2);

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Doohickey").should("not.exist");

    cy.reload();
    cy.wait("@dashcardQuery");

    cy.location("search").should("eq", "?text=Gizmo&text=Gadget");
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("2 selections");

    H.editDashboard();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(filter.name).find(".Icon-gear").click();

    H.getDashboardCard().within(() => {
      cy.findByText("Column to filter on");
      cy.findByText("18113 Source.CATEGORY").click();
    });

    // This part reproduces metabase#12614
    H.popover().within(() => {
      cy.findByText(/Ean/i);
      cy.findByText(/Title/i);
      cy.findByText(/Vendor/i);
      cy.findByText(/Category/i).click();
    });
  });

  it("should be possible to use ID filter on a nested question (metabase#17212)", () => {
    const baseQuestion = {
      query: { "source-table": PRODUCTS_ID },
    };

    createQuestion(baseQuestion).then(({ body: { id: baseQuestionId } }) => {
      const questionDetails = {
        query: { "source-table": `card__${baseQuestionId}` },
      };

      createQuestionAndDashboard({ questionDetails }).then(
        ({ body: { dashboard_id } }) => {
          H.visitDashboard(dashboard_id);
        },
      );
    });

    H.editDashboard();

    H.setFilter("ID");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("No valid fields").should("not.exist");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Select…").click();
    H.popover().contains("ID").click();
  });
});
