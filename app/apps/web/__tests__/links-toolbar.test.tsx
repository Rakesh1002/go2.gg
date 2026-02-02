import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinksToolbar } from "@/components/links/links-toolbar";
import { KeyboardShortcutProvider } from "@/contexts/keyboard-shortcut-context";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>;
}

const defaultPagination = {
  page: 1,
  perPage: 20,
  total: 100,
  hasMore: true,
};

describe("LinksToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show pagination info when no items selected", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
        />
      </Wrapper>
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("should show selection count when items are selected", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={["1", "2", "3"]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
        />
      </Wrapper>
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("selected")).toBeInTheDocument();
  });

  it("should call onClearSelection when X button clicked", () => {
    const onClearSelection = vi.fn();

    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={["1", "2"]}
          onClearSelection={onClearSelection}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
        />
      </Wrapper>
    );

    const clearButton = screen.getByLabelText("Clear selection");
    fireEvent.click(clearButton);

    expect(onClearSelection).toHaveBeenCalled();
  });

  it("should call onPageChange when Previous button clicked", () => {
    const onPageChange = vi.fn();

    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={{ ...defaultPagination, page: 2 }}
          onPageChange={onPageChange}
        />
      </Wrapper>
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should call onPageChange when Next button clicked", () => {
    const onPageChange = vi.fn();

    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={onPageChange}
        />
      </Wrapper>
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should disable Previous button on first page", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={{ ...defaultPagination, page: 1 }}
          onPageChange={vi.fn()}
        />
      </Wrapper>
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it("should disable Next button when no more pages", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={{ ...defaultPagination, hasMore: false }}
          onPageChange={vi.fn()}
        />
      </Wrapper>
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("should show bulk delete button when onBulkDelete provided", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={["1", "2"]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
          onBulkDelete={vi.fn()}
        />
      </Wrapper>
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should call onBulkDelete with selected IDs when Delete clicked", () => {
    const onBulkDelete = vi.fn();
    const selectedIds = ["1", "2", "3"];

    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={selectedIds}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
          onBulkDelete={onBulkDelete}
        />
      </Wrapper>
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(onBulkDelete).toHaveBeenCalledWith(selectedIds);
  });

  it("should show Tags button when onBulkTag provided", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={["1"]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
          onBulkTag={vi.fn()}
        />
      </Wrapper>
    );

    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(
      <Wrapper>
        <LinksToolbar
          selectedIds={[]}
          onClearSelection={vi.fn()}
          pagination={defaultPagination}
          onPageChange={vi.fn()}
          loading={true}
        />
      </Wrapper>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
