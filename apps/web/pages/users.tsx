import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { trpc } from "@quillsocial/trpc/react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Meta,
  SkeletonContainer,
  SkeletonText,
  Table,
  Select,
  showToast,
} from "@quillsocial/ui";
import { Search, User, Shield } from "@quillsocial/ui/components/icon";
import { useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { AUTH_OPTIONS } from "@quillsocial/features/auth/lib/next-auth-options";
import { UserPermissionRole } from "@quillsocial/prisma/enums";

type FilterState = {
  search: string;
  role: "USER" | "ADMIN" | "ALL";
  sortBy: "email" | "name" | "createdDate" | "role";
  sortOrder: "asc" | "desc";
};

function UsersPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "ALL",
    sortBy: "createdDate",
    sortOrder: "desc",
  });
  const [searchInput, setSearchInput] = useState("");

  const pageSize = 20;

  const { data, isLoading, error } = trpc.viewer.admin.listUsers.useQuery({
    page,
    pageSize,
    search: filters.search,
    role: filters.role,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput }));
    setPage(1);
  };

  const handleRoleFilter = (role: "USER" | "ADMIN" | "ALL") => {
    setFilters((prev) => ({ ...prev, role }));
    setPage(1);
  };

  const handleSort = (sortBy: FilterState["sortBy"]) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Shell
      heading={t("admin_users_title")}
      subtitle={t("admin_users_description")}
      withoutSeo={false}
      title={t("admin_users_title")}
    >
      <Meta title={t("admin_users_title")} description={t("admin_users_description")} />

      {/* Filters */}
      <div className="bg-default border-subtle mb-4 flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-subtle absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              className="border-default focus:border-emphasis w-full rounded-md border py-2 pl-10 pr-4"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.role}
            onChange={(e) => handleRoleFilter(e.target.value as "USER" | "ADMIN" | "ALL")}
            className="w-32"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">Users</option>
            <option value="ADMIN">Admins</option>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <SkeletonContainer>
          <div className="space-y-4">
            <SkeletonText className="h-10 w-full" />
            <SkeletonText className="h-10 w-full" />
            <SkeletonText className="h-10 w-full" />
            <SkeletonText className="h-10 w-full" />
          </div>
        </SkeletonContainer>
      ) : error ? (
        <Alert severity="error" title="Error loading users" message={error.message} />
      ) : data && data.users.length > 0 ? (
        <>
          <div className="border-subtle overflow-hidden rounded-md border">
            <Table>
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="hover:text-emphasis flex items-center gap-1 font-semibold"
                    >
                      User
                      {filters.sortBy === "name" && (
                        <span>{filters.sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("email")}
                      className="hover:text-emphasis flex items-center gap-1 font-semibold"
                    >
                      Email
                      {filters.sortBy === "email" && (
                        <span>{filters.sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("role")}
                      className="hover:text-emphasis flex items-center gap-1 font-semibold"
                    >
                      Role
                      {filters.sortBy === "role" && (
                        <span>{filters.sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Organization</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("createdDate")}
                      className="hover:text-emphasis flex items-center gap-1 font-semibold"
                    >
                      Created
                      {filters.sortBy === "createdDate" && (
                        <span>{filters.sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-subtle border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          alt={user.name || user.email}
                          imageSrc={user.avatar || undefined}
                        />
                        <div>
                          <div className="font-medium">{user.name || "Unnamed User"}</div>
                          {user.username && (
                            <div className="text-subtle text-xs">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{user.email}</div>
                      {user.emailVerified && (
                        <Badge variant="green" className="mt-1">
                          Verified
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === UserPermissionRole.ADMIN ? (
                        <Badge variant="blue" className="flex w-fit items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="gray" className="flex w-fit items-center gap-1">
                          <User className="h-3 w-3" />
                          User
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.organization ? (
                        <div className="text-sm">{user.organization.name}</div>
                      ) : (
                        <span className="text-subtle text-sm">No organization</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(user.createdDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {user.completedOnboarding ? (
                          <Badge variant="green">Active</Badge>
                        ) : (
                          <Badge variant="orange">Onboarding</Badge>
                        )}
                        {user.twoFactorEnabled && (
                          <Badge variant="blue" className="text-xs">
                            2FA
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-subtle text-sm">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, data.total)} of {data.total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border-subtle flex flex-col items-center justify-center rounded-md border p-12">
          <User className="text-subtle mb-4 h-12 w-12" />
          <h3 className="text-emphasis mb-2 font-semibold">No users found</h3>
          <p className="text-subtle text-sm">
            {filters.search
              ? "Try adjusting your search criteria"
              : "There are no users in the system"}
          </p>
        </div>
      )}
    </Shell>
  );
}

UsersPage.PageWrapper = PageWrapper;

export default UsersPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, AUTH_OPTIONS);

  // Redirect if no session
  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/write/0",
        permanent: false,
      },
    };
  }

  // Check if user has admin role in the database
  const { default: prisma } = await import("@quillsocial/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== UserPermissionRole.ADMIN) {
    return {
      redirect: {
        destination: "/write/0",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
