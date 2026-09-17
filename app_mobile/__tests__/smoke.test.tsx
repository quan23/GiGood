import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { EmptyState } from "@/components/shared/EmptyState";

describe("<EmptyState />", () => {
  test("renders the Vietnamese empty-state title", () => {
    render(
      <EmptyState
        title="Chưa có thông báo nào"
        subtitle="Các thông báo mới sẽ xuất hiện ở đây"
      />
    );

    expect(screen.getByText("Chưa có thông báo nào")).toBeTruthy();
  });
});
