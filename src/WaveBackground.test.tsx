import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WaveBackground } from "./WaveBackground";

describe("WaveBackground", () => {
  it("renders a canvas element", () => {
    const { container } = render(<WaveBackground />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<WaveBackground className="custom-class" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveClass("custom-class");
    expect(canvas).toHaveClass("wave-background");
  });

  it("applies absolute position class when requested", () => {
    const { container } = render(<WaveBackground position="absolute" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveClass("wave-background--absolute");
  });

  it("respects style prop", () => {
    const { container } = render(<WaveBackground style={{ opacity: 0.5 }} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveStyle({ opacity: 0.5 });
  });

  it("uses provided seed for wave generation", () => {
    const { container } = render(<WaveBackground seed={12345} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });
});
