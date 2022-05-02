import dynamic from "next/dynamic";
import { USERS_MANAGER_PAGE_HEADING } from "../../ui-config/strings";

const BaseLayout = dynamic(() => import("../../components/Admin/base-layout"));
const Menus = dynamic(() => import("../../components/Admin/menus"));

export default function SiteUsers() {
  return (
    <BaseLayout title={USERS_MANAGER_PAGE_HEADING}>
      <Menus />
    </BaseLayout>
  );
}
