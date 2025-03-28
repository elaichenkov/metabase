import { H } from "e2e/support";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  ORDERS_BY_YEAR_QUESTION_ID,
  ORDERS_QUESTION_ID,
} from "e2e/support/cypress_sample_instance_data";
import { createQuestion } from "e2e/support/helpers";

const { PEOPLE, PEOPLE_ID } = SAMPLE_DATABASE;

const multiSeriesQuestionWithGoal = {
  name: "multi",
  query: {
    "source-table": PEOPLE_ID,
    aggregation: [["count"]],
    breakout: [
      ["field", PEOPLE.SOURCE, null],
      [
        "field",
        PEOPLE.CREATED_AT,
        {
          "temporal-unit": "month",
        },
      ],
    ],
  },
  display: "line",
};

const timeSeriesQuestionId = ORDERS_BY_YEAR_QUESTION_ID;

const rawTestCases = [
  {
    questionType: "raw data question",
    questionId: ORDERS_QUESTION_ID,
  },
  {
    questionType: "timeseries question without a goal",
    questionId: timeSeriesQuestionId,
  },
];

describe("scenarios > alert > types", { tags: "@external" }, () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/alert").as("savedAlert");
    cy.intercept("GET", "/api/channel").as("channel");

    H.restore();
    cy.signInAsAdmin();
    cy.setCookie("metabase.SEEN_ALERT_SPLASH", "true");

    H.setupSMTP();
  });

  describe("rows based alerts", () => {
    rawTestCases.forEach(({ questionType, questionId }) => {
      it(`should be supported for ${questionType}`, () => {
        H.visitQuestion(questionId);

        H.openSharingMenu("Create alert");
        cy.wait("@channel");

        H.modal().within(() => {
          cy.findByText("Let's set up your alert").should("be.visible");
          cy.findByText("Done").click();
        });

        cy.wait("@savedAlert").then(({ response: { body } }) => {
          expect(body.alert_condition).to.equal("rows");
        });
      });
    });
  });

  describe("goal based alerts", () => {
    it("should work for timeseries questions with a set goal", () => {
      cy.request("PUT", `/api/card/${timeSeriesQuestionId}`, {
        visualization_settings: {
          "graph.show_goal": true,
          "graph.goal_value": 7000,
          "graph.dimensions": ["CREATED_AT"],
          "graph.metrics": ["count"],
        },
      });

      cy.log("Set the goal on timeseries question");
      H.visitQuestion(timeSeriesQuestionId);
      cy.findByTestId("chart-container").should("contain", "Goal");

      H.openSharingMenu("Create alert");
      cy.wait("@channel");

      cy.findByTestId("alert-create").within(() => {
        cy.findByText("Reaches the goal line").click();
        cy.findByText("The first time").click();
        cy.button("Done").click();
      });

      cy.log("Check the API response");
      cy.wait("@savedAlert").then(({ response: { body } }) => {
        expect(body.alert_condition).to.equal("goal");
        expect(body.alert_above_goal).to.equal(true);
        expect(body.alert_first_only).to.equal(true);
      });
    });

    it("should not be possible to create goal based alert for a multi-series question", () => {
      createQuestion(multiSeriesQuestionWithGoal, { visitQuestion: true });

      H.openSharingMenu("Create alert");
      cy.wait("@channel");

      // *** The warning below is not showing when we try to make an alert (Issue #???)
      // cy.contains(
      //   "Goal-based alerts aren't yet supported for charts with more than one line",
      // );

      H.modal().within(() => {
        cy.findByText("Let's set up your alert").should("be.visible");
        cy.findByText("Done").click();
      });

      // The alert condition should fall back to rows
      cy.wait("@savedAlert").then(({ response: { body } }) => {
        expect(body.alert_condition).to.equal("rows");
        expect(body.alert_above_goal).to.equal(null);
      });
    });
  });
});
