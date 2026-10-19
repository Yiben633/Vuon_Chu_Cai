import { EmptyState } from "../../components/common/StatusStates.jsx";

export function ParentSectionPage({ title }) {
  return (
    <EmptyState
      title={title}
      message="Layout và route đã sẵn sàng; dữ liệu, form và mutation thật sẽ được nối ở prompt phụ huynh."
    />
  );
}
