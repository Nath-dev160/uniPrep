"use client";

import * as React from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  Plus,
  School,
  Search,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createAcademicLevelAction,
  createCourseAction,
  createDepartmentAction,
  createFacultyAction,
  createTopicAction,
  createUniversityAction,
  deleteAcademicLevelAction,
  deleteCourseAction,
  deleteDepartmentAction,
  deleteFacultyAction,
  deleteTopicAction,
  deleteUniversityAction,
  updateAcademicLevelAction,
  updateCourseAction,
  updateDepartmentAction,
  updateFacultyAction,
  updateTopicAction,
  updateUniversityAction,
  type AcademicActionResult,
} from "@/features/academic/actions";
import type { AcademicHierarchyData } from "@/features/academic/queries";
import type {
  AcademicLevelRow,
  CourseRow,
  DepartmentRow,
  FacultyRow,
  TopicRow,
  UniversityRow,
} from "@/types/database";

type AdminTab =
  | "universities"
  | "faculties"
  | "departments"
  | "levels"
  | "courses"
  | "topics";

interface AdminAcademicManagerProps {
  initialData: AcademicHierarchyData;
}

export function AdminAcademicManager({ initialData }: AdminAcademicManagerProps) {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("universities");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal / Form state for Add/Edit
  const [modalMode, setModalMode] = React.useState<"add" | "edit" | null>(null);
  const [editingItem, setEditingItem] = React.useState<any>(null);

  // Cascading selector state inside forms
  const [formUniId, setFormUniId] = React.useState("");
  const [formFacId, setFormFacId] = React.useState("");
  const [formDeptId, setFormDeptId] = React.useState("");

  // Dismiss notification after 6 seconds
  React.useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleActionComplete = (res: AcademicActionResult) => {
    if (res.success) {
      setNotification({
        type: "success",
        message: res.message || "Operation completed successfully.",
      });
      setModalMode(null);
      setEditingItem(null);
    } else {
      setNotification({
        type: "error",
        message: res.error || "An error occurred during this operation.",
      });
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormUniId("");
    setFormFacId("");
    setFormDeptId("");
    setModalMode("add");
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === "faculties") {
      setFormUniId(item.university_id || "");
    } else if (activeTab === "departments") {
      const fac = initialData.faculties.find((f) => f.id === item.faculty_id);
      setFormUniId(fac?.university_id || "");
      setFormFacId(item.faculty_id || "");
    } else if (activeTab === "courses") {
      const dept = initialData.departments.find((d) => d.id === item.department_id);
      const fac = initialData.faculties.find((f) => f.id === dept?.faculty_id);
      setFormUniId(fac?.university_id || "");
      setFormFacId(dept?.faculty_id || "");
      setFormDeptId(item.department_id || "");
    } else if (activeTab === "topics") {
      const course = initialData.courses.find((c) => c.id === item.course_id);
      const dept = initialData.departments.find((d) => d.id === course?.department_id);
      const fac = initialData.faculties.find((f) => f.id === dept?.faculty_id);
      setFormUniId(fac?.university_id || "");
      setFormFacId(dept?.faculty_id || "");
      setFormDeptId(course?.department_id || "");
    }
    setModalMode("edit");
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      let res: AcademicActionResult;
      switch (activeTab) {
        case "universities":
          res = await deleteUniversityAction(formData);
          break;
        case "faculties":
          res = await deleteFacultyAction(formData);
          break;
        case "departments":
          res = await deleteDepartmentAction(formData);
          break;
        case "levels":
          res = await deleteAcademicLevelAction(formData);
          break;
        case "courses":
          res = await deleteCourseAction(formData);
          break;
        case "topics":
          res = await deleteTopicAction(formData);
          break;
      }
      handleActionComplete(res);
    });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingItem?.id) {
      formData.append("id", editingItem.id);
    }

    startTransition(async () => {
      let res: AcademicActionResult;
      if (modalMode === "add") {
        switch (activeTab) {
          case "universities":
            res = await createUniversityAction(formData);
            break;
          case "faculties":
            res = await createFacultyAction(formData);
            break;
          case "departments":
            res = await createDepartmentAction(formData);
            break;
          case "levels":
            res = await createAcademicLevelAction(formData);
            break;
          case "courses":
            res = await createCourseAction(formData);
            break;
          case "topics":
            res = await createTopicAction(formData);
            break;
        }
      } else {
        switch (activeTab) {
          case "universities":
            res = await updateUniversityAction(formData);
            break;
          case "faculties":
            res = await updateFacultyAction(formData);
            break;
          case "departments":
            res = await updateDepartmentAction(formData);
            break;
          case "levels":
            res = await updateAcademicLevelAction(formData);
            break;
          case "courses":
            res = await updateCourseAction(formData);
            break;
          case "topics":
            res = await updateTopicAction(formData);
            break;
        }
      }
      handleActionComplete(res);
    });
  };

  // Helper counts
  const stats = {
    universities: initialData.universities.length,
    faculties: initialData.faculties.length,
    departments: initialData.departments.length,
    levels: initialData.academicLevels.length,
    courses: initialData.courses.length,
    topics: initialData.topics.length,
  };

  return (
    <div className="space-y-8">
      {/* Notification banner */}
      {notification && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-md border p-4 text-sm ${
            notification.type === "success"
              ? "border-teal/40 bg-teal/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          variant={activeTab === "universities" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("universities");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <School className="h-4 w-4" aria-hidden />
          Universities ({stats.universities})
        </Button>

        <Button
          variant={activeTab === "faculties" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("faculties");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <Building2 className="h-4 w-4" aria-hidden />
          Faculties ({stats.faculties})
        </Button>

        <Button
          variant={activeTab === "departments" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("departments");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <Layers className="h-4 w-4" aria-hidden />
          Departments ({stats.departments})
        </Button>

        <Button
          variant={activeTab === "levels" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("levels");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <GraduationCap className="h-4 w-4" aria-hidden />
          Academic Levels ({stats.levels})
        </Button>

        <Button
          variant={activeTab === "courses" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("courses");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Courses ({stats.courses})
        </Button>

        <Button
          variant={activeTab === "topics" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("topics");
            setSearchQuery("");
          }}
          className="gap-1.5"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Topics ({stats.topics})
        </Button>
      </div>

      {/* Action header & search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="pl-9"
          />
        </div>

        <Button onClick={openAddModal} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden />
          Add{" "}
          {activeTab === "universities"
            ? "University"
            : activeTab === "faculties"
              ? "Faculty"
              : activeTab === "departments"
                ? "Department"
                : activeTab === "levels"
                  ? "Academic Level"
                  : activeTab === "courses"
                    ? "Course"
                    : "Topic"}
        </Button>
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-border bg-card">
        {activeTab === "universities" && (
          <UniversitiesList
            items={initialData.universities}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}

        {activeTab === "faculties" && (
          <FacultiesList
            items={initialData.faculties}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}

        {activeTab === "departments" && (
          <DepartmentsList
            items={initialData.departments}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}

        {activeTab === "levels" && (
          <AcademicLevelsList
            items={initialData.academicLevels}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}

        {activeTab === "courses" && (
          <CoursesList
            items={initialData.courses}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}

        {activeTab === "topics" && (
          <TopicsList
            items={initialData.topics}
            searchQuery={searchQuery}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPending={isPending}
            onAddFirst={openAddModal}
          />
        )}
      </div>

      {/* Modal Dialog for Add / Edit */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-lg font-semibold text-foreground">
                {modalMode === "add" ? "Create New" : "Edit"}{" "}
                {activeTab === "universities"
                  ? "University"
                  : activeTab === "faculties"
                    ? "Faculty"
                    : activeTab === "departments"
                      ? "Department"
                      : activeTab === "levels"
                        ? "Academic Level"
                        : activeTab === "courses"
                          ? "Course"
                          : "Topic"}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Form fields depending on active tab */}
              {activeTab === "universities" && (
                <UniversityFormFields item={editingItem} />
              )}

              {activeTab === "faculties" && (
                <FacultyFormFields
                  item={editingItem}
                  universities={initialData.universities}
                />
              )}

              {activeTab === "departments" && (
                <DepartmentFormFields
                  item={editingItem}
                  universities={initialData.universities}
                  faculties={initialData.faculties}
                  formUniId={formUniId}
                  setFormUniId={setFormUniId}
                />
              )}

              {activeTab === "levels" && (
                <AcademicLevelFormFields
                  item={editingItem}
                  universities={initialData.universities}
                />
              )}

              {activeTab === "courses" && (
                <CourseFormFields
                  item={editingItem}
                  universities={initialData.universities}
                  faculties={initialData.faculties}
                  departments={initialData.departments}
                  academicLevels={initialData.academicLevels}
                  formUniId={formUniId}
                  setFormUniId={setFormUniId}
                  formFacId={formFacId}
                  setFormFacId={setFormFacId}
                />
              )}

              {activeTab === "topics" && (
                <TopicFormFields
                  item={editingItem}
                  universities={initialData.universities}
                  faculties={initialData.faculties}
                  departments={initialData.departments}
                  courses={initialData.courses}
                  formUniId={formUniId}
                  setFormUniId={setFormUniId}
                  formFacId={formFacId}
                  setFormFacId={setFormFacId}
                  formDeptId={formDeptId}
                  setFormDeptId={setFormDeptId}
                />
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalMode(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Create"
                      : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// LIST COMPONENTS
// ----------------------------------------------------------------------------

function UniversitiesList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: UniversityRow[];
  searchQuery: string;
  onEdit: (item: UniversityRow) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.short_name && u.short_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <School className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No universities have been added yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Create the first university to start building the academic hierarchy.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add University
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No universities match &quot;{searchQuery}&quot;.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((u) => (
        <div
          key={u.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{u.name}</span>
              {u.short_name && <Badge variant="secondary">{u.short_name}</Badge>}
              {!u.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Slug: <span className="font-mono">{u.slug}</span> • Country: {u.country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(u)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(u.id, u.name)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FacultiesList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: (FacultyRow & { university?: UniversityRow | null })[];
  searchQuery: string;
  onEdit: (item: any) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.code && f.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.university?.name &&
        f.university.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No faculties have been added yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Faculties organize academic departments under each university.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Faculty
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No faculties match &quot;{searchQuery}&quot;.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((f) => (
        <div
          key={f.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{f.name}</span>
              {f.code && <Badge variant="secondary">{f.code}</Badge>}
              {!f.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              University:{" "}
              <span className="font-medium text-foreground">
                {f.university?.name || "Unassigned"}
              </span>{" "}
              • Slug: <span className="font-mono">{f.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(f)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(f.id, f.name)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DepartmentsList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: (DepartmentRow & { faculty?: FacultyRow | null })[];
  searchQuery: string;
  onEdit: (item: any) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.faculty?.name && d.faculty.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <Layers className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No departments have been added yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Departments represent academic majors and host specific courses.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No departments match &quot;{searchQuery}&quot;.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((d) => (
        <div
          key={d.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{d.name}</span>
              {d.code && <Badge variant="secondary">{d.code}</Badge>}
              {!d.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faculty:{" "}
              <span className="font-medium text-foreground">
                {d.faculty?.name || "Unassigned"}
              </span>{" "}
              • Slug: <span className="font-mono">{d.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(d)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(d.id, d.name)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AcademicLevelsList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: AcademicLevelRow[];
  searchQuery: string;
  onEdit: (item: AcademicLevelRow) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No academic levels configured yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Configure levels such as 100 Level (Rank 100), 200 Level (Rank 200), etc.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Academic Level
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((l) => (
        <div
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{l.name}</span>
              <Badge variant="secondary">Code: {l.code}</Badge>
              <Badge variant="accent">Rank: {l.rank}</Badge>
              {!l.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scope: {l.university_id ? "University Specific" : "Global"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(l)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(l.id, l.name)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: (CourseRow & {
    department?: DepartmentRow | null;
    academicLevel?: AcademicLevelRow | null;
  })[];
  searchQuery: string;
  onEdit: (item: any) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department?.name &&
        c.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No courses have been added yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Courses belong to a department and optional academic level.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No courses match &quot;{searchQuery}&quot;.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((c) => (
        <div
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-primary">{c.code}</span>
              <span className="font-medium text-foreground">{c.title}</span>
              {c.academicLevel && (
                <Badge variant="secondary">{c.academicLevel.code}</Badge>
              )}
              {c.credit_units !== null && (
                <Badge variant="outline">{c.credit_units} units</Badge>
              )}
              {c.semester && (
                <Badge variant="outline">Sem {c.semester}</Badge>
              )}
              {!c.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Department:{" "}
              <span className="font-medium text-foreground">
                {c.department?.name || "Unassigned"}
              </span>{" "}
              • Slug: <span className="font-mono">{c.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(c)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(c.id, `${c.code} — ${c.title}`)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicsList({
  items,
  searchQuery,
  onEdit,
  onDelete,
  isPending,
  onAddFirst,
}: {
  items: (TopicRow & { course?: CourseRow | null })[];
  searchQuery: string;
  onEdit: (item: any) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
  onAddFirst: () => void;
}) {
  const filtered = items.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.course?.code && t.course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.course?.title && t.course.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-base font-medium text-foreground">
          No topics have been added yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Topics break courses down into modular syllabus areas for targeted practice.
        </p>
        <Button onClick={onAddFirst} className="mt-4 gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Add Topic
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No topics match &quot;{searchQuery}&quot;.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((t) => (
        <div
          key={t.id}
          className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{t.name}</span>
              <Badge variant="secondary">Order #{t.display_order}</Badge>
              {!t.is_active && <Badge variant="muted">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Course:{" "}
              <span className="font-medium text-foreground">
                {t.course ? `${t.course.code} — ${t.course.title}` : "Unassigned"}
              </span>{" "}
              • Slug: <span className="font-mono">{t.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(t)}
              disabled={isPending}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(t.id, t.name)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// FORM FIELD HELPERS
// ----------------------------------------------------------------------------

function UniversityFormFields({ item }: { item?: UniversityRow | null }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground">University Name *</label>
        <Input
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="e.g. University of Lagos"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Short Name / Acronym</label>
          <Input
            name="short_name"
            defaultValue={item?.short_name ?? ""}
            placeholder="e.g. UNILAG"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Country</label>
          <Input
            name="country"
            defaultValue={item?.country ?? "Nigeria"}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">Slug (Optional, auto-generated)</label>
        <Input
          name="slug"
          defaultValue={item?.slug ?? ""}
          placeholder="e.g. unilag"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="u_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="u_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}

function FacultyFormFields({
  item,
  universities,
}: {
  item?: any;
  universities: UniversityRow[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground">Parent University *</label>
        <select
          name="university_id"
          defaultValue={item?.university_id ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select University...</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">Faculty Name *</label>
        <Input
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="e.g. Faculty of Engineering"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Faculty Code</label>
          <Input
            name="code"
            defaultValue={item?.code ?? ""}
            placeholder="e.g. ENG"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Slug</label>
          <Input
            name="slug"
            defaultValue={item?.slug ?? ""}
            placeholder="e.g. engineering"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">Description</label>
        <Input
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Short description"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="f_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="f_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}

function DepartmentFormFields({
  item,
  universities,
  faculties,
  formUniId,
  setFormUniId,
}: {
  item?: any;
  universities: UniversityRow[];
  faculties: FacultyRow[];
  formUniId: string;
  setFormUniId: (id: string) => void;
}) {
  const filteredFaculties = formUniId
    ? faculties.filter((f) => f.university_id === formUniId)
    : faculties;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground">Filter by University (Helper)</label>
        <select
          value={formUniId}
          onChange={(e) => setFormUniId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Universities</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Parent Faculty *</label>
        <select
          name="faculty_id"
          defaultValue={item?.faculty_id ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select Faculty...</option>
          {filteredFaculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} {f.code ? `(${f.code})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Department Name *</label>
        <Input
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="e.g. Department of Computer Science"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Department Code</label>
          <Input
            name="code"
            defaultValue={item?.code ?? ""}
            placeholder="e.g. CSC"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Slug</label>
          <Input
            name="slug"
            defaultValue={item?.slug ?? ""}
            placeholder="e.g. computer-science"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Description</label>
        <Input
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Short description"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="d_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="d_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}

function AcademicLevelFormFields({
  item,
  universities,
}: {
  item?: AcademicLevelRow | null;
  universities: UniversityRow[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground">Scope (Optional)</label>
        <select
          name="university_id"
          defaultValue={item?.university_id ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Global (All Universities)</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Level Name *</label>
        <Input
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="e.g. 100 Level"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Level Code *</label>
          <Input
            name="code"
            defaultValue={item?.code ?? ""}
            placeholder="e.g. 100L"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Rank (Ordering) *</label>
          <Input
            type="number"
            name="rank"
            defaultValue={item?.rank ?? 100}
            min={1}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="l_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="l_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}

function CourseFormFields({
  item,
  universities,
  faculties,
  departments,
  academicLevels,
  formUniId,
  setFormUniId,
  formFacId,
  setFormFacId,
}: {
  item?: any;
  universities: UniversityRow[];
  faculties: FacultyRow[];
  departments: DepartmentRow[];
  academicLevels: AcademicLevelRow[];
  formUniId: string;
  setFormUniId: (id: string) => void;
  formFacId: string;
  setFormFacId: (id: string) => void;
}) {
  const filteredFaculties = formUniId
    ? faculties.filter((f) => f.university_id === formUniId)
    : faculties;

  const filteredDepartments = formFacId
    ? departments.filter((d) => d.faculty_id === formFacId)
    : departments;

  return (
    <div className="space-y-3">
      {/* Cascading selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">University Filter</label>
          <select
            value={formUniId}
            onChange={(e) => {
              setFormUniId(e.target.value);
              setFormFacId("");
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">Faculty Filter</label>
          <select
            value={formFacId}
            onChange={(e) => setFormFacId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Faculties</option>
            {filteredFaculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Parent Department *</label>
        <select
          name="department_id"
          defaultValue={item?.department_id ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select Department...</option>
          {filteredDepartments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.code ? `(${d.code})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Academic Level</label>
        <select
          name="academic_level_id"
          defaultValue={item?.academic_level_id ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select Academic Level (Optional)...</option>
          {academicLevels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Course Code *</label>
          <Input
            name="code"
            defaultValue={item?.code ?? ""}
            placeholder="e.g. CSC 201"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Course Title *</label>
          <Input
            name="title"
            defaultValue={item?.title ?? ""}
            placeholder="e.g. Computer Programming I"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Credit Units</label>
          <Input
            type="number"
            name="credit_units"
            defaultValue={item?.credit_units ?? 3}
            min={0}
            max={30}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Semester</label>
          <select
            name="semester"
            defaultValue={item?.semester ?? 1}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Slug</label>
          <Input
            name="slug"
            defaultValue={item?.slug ?? ""}
            placeholder="e.g. csc-201"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Course Description</label>
        <Input
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Brief syllabus outline or course summary"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="c_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="c_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}

function TopicFormFields({
  item,
  universities,
  faculties,
  departments,
  courses,
  formUniId,
  setFormUniId,
  formFacId,
  setFormFacId,
  formDeptId,
  setFormDeptId,
}: {
  item?: any;
  universities: UniversityRow[];
  faculties: FacultyRow[];
  departments: DepartmentRow[];
  courses: CourseRow[];
  formUniId: string;
  setFormUniId: (id: string) => void;
  formFacId: string;
  setFormFacId: (id: string) => void;
  formDeptId: string;
  setFormDeptId: (id: string) => void;
}) {
  const filteredDepartments = formFacId
    ? departments.filter((d) => d.faculty_id === formFacId)
    : departments;

  const filteredCourses = formDeptId
    ? courses.filter((c) => c.department_id === formDeptId)
    : courses;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Department Filter</label>
          <select
            value={formDeptId}
            onChange={(e) => setFormDeptId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {filteredDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">Parent Course *</label>
          <select
            name="course_id"
            defaultValue={item?.course_id ?? ""}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select Course...</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Topic Name *</label>
        <Input
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="e.g. Boolean Algebra & Logic Gates"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Display Order (0, 1, 2...)</label>
          <Input
            type="number"
            name="display_order"
            defaultValue={item?.display_order ?? 0}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Slug</label>
          <Input
            name="slug"
            defaultValue={item?.slug ?? ""}
            placeholder="e.g. boolean-algebra"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Description</label>
        <Input
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Key concepts or learning goals"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="t_is_active"
          name="is_active"
          value="true"
          defaultChecked={item ? item.is_active : true}
          className="rounded border-border"
        />
        <label htmlFor="t_is_active" className="text-xs font-medium text-foreground">
          Active (Visible to students)
        </label>
      </div>
    </div>
  );
}
