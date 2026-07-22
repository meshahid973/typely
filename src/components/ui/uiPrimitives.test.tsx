import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GameButton } from "./GameButton";
import { ProgressLine } from "./ProgressLine";
import { Toggle } from "./Toggle";

describe("GameButton", () => {
  it("renders a button with the requested variant", () => {
    const markup = renderToStaticMarkup(<GameButton variant="secondary">continue</GameButton>);

    expect(markup).toContain('type="button"');
    expect(markup).toContain("game-button-secondary");
    expect(markup).toContain("continue");
  });
});

describe("Toggle", () => {
  it("connects its label and native checkbox", () => {
    const markup = renderToStaticMarkup(
      <Toggle id="example" label="Example" checked onChange={() => undefined} />,
    );

    expect(markup).toContain('for="example"');
    expect(markup).toContain('id="example"');
    expect(markup).toContain("checked");
  });
});

describe("ProgressLine", () => {
  it("exposes normalized progress to assistive technology", () => {
    const markup = renderToStaticMarkup(<ProgressLine value={1.4} />);

    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="100"');
  });
});
