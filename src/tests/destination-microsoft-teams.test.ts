import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import MicrosoftTeams from "../destinations/Microsoft Teams/index.js";

import type { MicrosoftTeamsAction, MicrosoftTeamsBodyItem, MicrosoftTeamsPayload } from "../types/destinations/microsoft-teams.types";
import type { MessageObject } from "../types/log.types";

import { minimalPackage } from "./lib/minimal-package";

const originalEnv = { ...process.env };

describe("Microsoft Teams log destination", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should be active when environment variable 'TEAMS_WEBHOOK_URL' is set", () => {
    process.env["TEAMS_WEBHOOK_URL"] = "https://example.webhook.office.com/webhookb2/...";

    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackage);

    assert.strictEqual(microsoftTeamsDestination.active, true);
  });

  it("should NOT be active when environment variable 'TEAMS_WEBHOOK_URL' is not set", () => {
    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackage);

    assert.strictEqual(microsoftTeamsDestination.active, false);
  });

  it("payload should include ContextId as a Fact when present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {
        ContextId: "12345"
      }
    };

    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackage);
    const payload: MicrosoftTeamsPayload = microsoftTeamsDestination.createPayload<MicrosoftTeamsPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.strictEqual(payload.attachments.length, 1, "Payload should only have 1 attachment");
    assert.strictEqual(payload.attachments[0]?.content.body.length, 4, "Payload attachment content body should only have 4 elements");
    assert.strictEqual(
      (payload.attachments[0]?.content.body[2] as MicrosoftTeamsBodyItem).facts?.length,
      1,
      "Payload body factset should only have 1 element"
    );
  });

  it("payload should include exception as a Fact when present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      exception: new Error("Test error").stack,
      properties: {
        ContextId: "12345"
      }
    };

    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackage);
    const payload: MicrosoftTeamsPayload = microsoftTeamsDestination.createPayload<MicrosoftTeamsPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.strictEqual(payload.attachments.length, 1, "Payload should only have 1 attachment");
    assert.strictEqual(payload.attachments[0]?.content.body.length, 6, "Payload attachment content body should only have 6 elements");
    assert.strictEqual(
      (payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).text,
      "Exception",
      "Payload body exception title text should be 'Exception'"
    );
    assert.strictEqual(
      (payload.attachments[0]?.content.body[4] as MicrosoftTeamsBodyItem).text,
      messageObject.exception,
      "Payload body exception text should be the exception stack from messageObject"
    );
  });

  it("payload should include actions with links from process.env['TEAMS_LINKS'] when present", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {}
    };

    const link1Title = "Test Link 1";
    const link1Url = "https://example.com/test1";
    const link2Title = "Test Link 2";
    const link2Url = "https://example.com/test2";
    process.env["TEAMS_LINKS"] = `${link1Title};${link1Url},${link2Title};${link2Url}`;

    const minimalPackageWithoutRepository = { ...minimalPackage };
    delete minimalPackageWithoutRepository.repository;

    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackageWithoutRepository);
    const payload: MicrosoftTeamsPayload = microsoftTeamsDestination.createPayload<MicrosoftTeamsPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.strictEqual(payload.attachments.length, 1, "Payload should only have 1 attachment");
    assert.strictEqual(payload.attachments[0]?.content.body.length, 4, "Payload attachment content body should only have 4 elements");
    assert.strictEqual(
      (payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).type,
      "ActionSet",
      "Payload body type should be 'ActionSet'"
    );
    assert.strictEqual(
      (payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).actions?.length,
      2,
      "Payload body ActionSet actions should only have 2 elements"
    );
    assert.ok(
      ((payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).actions as MicrosoftTeamsAction[]).every(
        (action: MicrosoftTeamsAction, index: number) => {
          return index === 0 ? action.title === link1Title && action.url === link1Url : action.title === link2Title && action.url === link2Url;
        }
      ),
      "Payload body ActionSet actions should be the links from TEAMS_LINKS environment variable"
    );
  });

  it("payload should include actions with links from process.env['TEAMS_LINKS'] when present and repository from package.json when present", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {}
    };

    const link1Title = "Test Link 1";
    const link1Url = "https://example.com/test1";
    const link2Title = "Test Link 2";
    const link2Url = "https://example.com/test2";
    process.env["TEAMS_LINKS"] = `${link1Title};${link1Url},${link2Title};${link2Url}`;

    const microsoftTeamsDestination = new MicrosoftTeams(minimalPackage);
    const payload: MicrosoftTeamsPayload = microsoftTeamsDestination.createPayload<MicrosoftTeamsPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.strictEqual(payload.attachments.length, 1, "Payload should only have 1 attachment");
    assert.strictEqual(payload.attachments[0]?.content.body.length, 4, "Payload attachment content body should only have 4 elements");
    assert.strictEqual(
      (payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).type,
      "ActionSet",
      "Payload body type should be 'ActionSet'"
    );
    assert.strictEqual(
      (payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).actions?.length,
      3,
      "Payload body ActionSet actions should only have 3 elements"
    );
    assert.ok(
      ((payload.attachments[0]?.content.body[3] as MicrosoftTeamsBodyItem).actions as MicrosoftTeamsAction[]).every(
        (action: MicrosoftTeamsAction, index: number) => {
          if (action.type !== "Action.OpenUrl") {
            return false;
          }

          if (index === 0) {
            return action.title === link1Title && action.url === link1Url;
          }

          if (index === 1) {
            return action.title === link2Title && action.url === link2Url;
          }

          const repositoryUrl = (minimalPackage.repository as { url: string }).url?.replace(/^git\+/, "").replace(/\.git$/, "") as string;
          if (index === 2) {
            return action.title === "Repository" && action.url === repositoryUrl;
          }

          return false;
        }
      ),
      "Payload body ActionSet actions should be the links from TEAMS_LINKS environment variable"
    );
  });
});
