import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  AcademicLevelRow,
  CourseRow,
  DepartmentRow,
  FacultyRow,
  ProfileRow,
  TopicRow,
  UniversityRow,
} from "@/types/database";
import {
  MOCK_ACADEMIC_LEVELS,
  MOCK_COURSES,
  MOCK_DEPARTMENTS,
  MOCK_FACULTIES,
  MOCK_TOPICS,
  MOCK_UNIVERSITIES,
} from "./mock-data";

export interface AcademicHierarchyData {
  universities: UniversityRow[];
  faculties: (FacultyRow & { university?: UniversityRow | null })[];
  departments: (DepartmentRow & { faculty?: FacultyRow | null })[];
  academicLevels: AcademicLevelRow[];
  courses: (CourseRow & {
    department?: DepartmentRow | null;
    academicLevel?: AcademicLevelRow | null;
  })[];
  topics: (TopicRow & { course?: CourseRow | null })[];
}

export interface StudentAcademicDetails {
  university: UniversityRow | null;
  faculty: FacultyRow | null;
  department: DepartmentRow | null;
  academicLevel: AcademicLevelRow | null;
}

/**
 * Returns all universities.
 */
export async function getUniversities(
  onlyActive: boolean = true
): Promise<UniversityRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from("universities").select("*").order("name", { ascending: true });
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as UniversityRow[];
      }
    } catch {
      // Fallback below
    }
  }
  return onlyActive ? MOCK_UNIVERSITIES.filter((u) => u.is_active) : MOCK_UNIVERSITIES;
}

/**
 * Returns faculties optionally filtered by university_id.
 */
export async function getFaculties(
  universityId?: string,
  onlyActive: boolean = true
): Promise<FacultyRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from("faculties").select("*").order("name", { ascending: true });
      if (universityId) {
        query = query.eq("university_id", universityId);
      }
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as FacultyRow[];
      }
    } catch {
      // Fallback below
    }
  }

  let result = [...MOCK_FACULTIES];
  if (universityId) {
    result = result.filter((f) => f.university_id === universityId);
  }
  if (onlyActive) {
    result = result.filter((f) => f.is_active);
  }
  return result;
}

/**
 * Returns departments optionally filtered by faculty_id.
 */
export async function getDepartments(
  facultyId?: string,
  onlyActive: boolean = true
): Promise<DepartmentRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from("departments").select("*").order("name", { ascending: true });
      if (facultyId) {
        query = query.eq("faculty_id", facultyId);
      }
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DepartmentRow[];
      }
    } catch {
      // Fallback below
    }
  }

  let result = [...MOCK_DEPARTMENTS];
  if (facultyId) {
    result = result.filter((d) => d.faculty_id === facultyId);
  }
  if (onlyActive) {
    result = result.filter((d) => d.is_active);
  }
  return result;
}

/**
 * Returns academic levels.
 */
export async function getAcademicLevels(
  universityId?: string,
  onlyActive: boolean = true
): Promise<AcademicLevelRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("academic_levels")
        .select("*")
        .order("rank", { ascending: true });

      if (universityId) {
        query = query.or(`university_id.eq.${universityId},university_id.is.null`);
      }
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as AcademicLevelRow[];
      }
    } catch {
      // Fallback below
    }
  }

  let result = [...MOCK_ACADEMIC_LEVELS];
  if (onlyActive) {
    result = result.filter((l) => l.is_active);
  }
  return result;
}

/**
 * Returns courses optionally filtered by department_id or academic_level_id.
 */
export async function getCourses(
  departmentId?: string,
  academicLevelId?: string,
  onlyActive: boolean = true
): Promise<CourseRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from("courses").select("*").order("code", { ascending: true });
      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }
      if (academicLevelId) {
        query = query.eq("academic_level_id", academicLevelId);
      }
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CourseRow[];
      }
    } catch {
      // Fallback below
    }
  }

  let result = [...MOCK_COURSES];
  if (departmentId) {
    result = result.filter((c) => c.department_id === departmentId);
  }
  if (academicLevelId) {
    result = result.filter((c) => c.academic_level_id === academicLevelId);
  }
  if (onlyActive) {
    result = result.filter((c) => c.is_active);
  }
  return result;
}

/**
 * Returns topics for a course.
 */
export async function getTopics(
  courseId?: string,
  onlyActive: boolean = true
): Promise<TopicRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("topics")
        .select("*")
        .order("display_order", { ascending: true });
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      if (onlyActive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as TopicRow[];
      }
    } catch {
      // Fallback below
    }
  }

  let result = [...MOCK_TOPICS];
  if (courseId) {
    result = result.filter((t) => t.course_id === courseId);
  }
  if (onlyActive) {
    result = result.filter((t) => t.is_active);
  }
  return result;
}

/**
 * Fetches the entire academic hierarchy for the admin management view.
 */
export async function getFullAcademicHierarchy(): Promise<AcademicHierarchyData> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();

      const [
        unisRes,
        facsRes,
        deptsRes,
        levelsRes,
        coursesRes,
        topicsRes,
      ] = await Promise.all([
        supabase.from("universities").select("*").order("name", { ascending: true }),
        supabase.from("faculties").select("*, university:universities(*)").order("name", { ascending: true }),
        supabase.from("departments").select("*, faculty:faculties(*)").order("name", { ascending: true }),
        supabase.from("academic_levels").select("*").order("rank", { ascending: true }),
        supabase
          .from("courses")
          .select("*, department:departments(*), academicLevel:academic_levels(*)")
          .order("code", { ascending: true }),
        supabase.from("topics").select("*, course:courses(*)").order("display_order", { ascending: true }),
      ]);

      if (
        unisRes.data &&
        unisRes.data.length > 0 &&
        facsRes.data &&
        coursesRes.data
      ) {
        return {
          universities: (unisRes.data as UniversityRow[]) || [],
          faculties: (facsRes.data as any) || [],
          departments: (deptsRes.data as any) || [],
          academicLevels: (levelsRes.data as AcademicLevelRow[]) || [],
          courses: (coursesRes.data as any) || [],
          topics: (topicsRes.data as any) || [],
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback enriched hierarchy
  const uniMap = new Map(MOCK_UNIVERSITIES.map((u) => [u.id, u]));
  const facMap = new Map(MOCK_FACULTIES.map((f) => [f.id, f]));
  const deptMap = new Map(MOCK_DEPARTMENTS.map((d) => [d.id, d]));
  const levelMap = new Map(MOCK_ACADEMIC_LEVELS.map((l) => [l.id, l]));
  const courseMap = new Map(MOCK_COURSES.map((c) => [c.id, c]));

  return {
    universities: MOCK_UNIVERSITIES,
    faculties: MOCK_FACULTIES.map((f) => ({
      ...f,
      university: uniMap.get(f.university_id) || null,
    })),
    departments: MOCK_DEPARTMENTS.map((d) => ({
      ...d,
      faculty: facMap.get(d.faculty_id) || null,
    })),
    academicLevels: MOCK_ACADEMIC_LEVELS,
    courses: MOCK_COURSES.map((c) => ({
      ...c,
      department: deptMap.get(c.department_id) || null,
      academicLevel: c.academic_level_id ? levelMap.get(c.academic_level_id) || null : null,
    })),
    topics: MOCK_TOPICS.map((t) => ({
      ...t,
      course: courseMap.get(t.course_id) || null,
    })),
  };
}

/**
 * Resolves the display details for a student's assigned academic hierarchy context.
 */
export async function getStudentAcademicDetails(
  profile: ProfileRow | null
): Promise<StudentAcademicDetails> {
  if (!profile) {
    return {
      university: null,
      faculty: null,
      department: null,
      academicLevel: null,
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();

      const [uniRes, facRes, deptRes, levelRes] = await Promise.all([
        profile.university_id
          ? supabase.from("universities").select("*").eq("id", profile.university_id).maybeSingle<UniversityRow>()
          : Promise.resolve({ data: null }),
        profile.faculty_id
          ? supabase.from("faculties").select("*").eq("id", profile.faculty_id).maybeSingle<FacultyRow>()
          : Promise.resolve({ data: null }),
        profile.department_id
          ? supabase.from("departments").select("*").eq("id", profile.department_id).maybeSingle<DepartmentRow>()
          : Promise.resolve({ data: null }),
        profile.academic_level_id
          ? supabase.from("academic_levels").select("*").eq("id", profile.academic_level_id).maybeSingle<AcademicLevelRow>()
          : Promise.resolve({ data: null }),
      ]);

      if (uniRes.data || facRes.data || deptRes.data || levelRes.data) {
        return {
          university: uniRes.data ?? null,
          faculty: facRes.data ?? null,
          department: deptRes.data ?? null,
          academicLevel: levelRes.data ?? null,
        };
      }
    } catch {
      // Fallback below
    }
  }

  return {
    university: MOCK_UNIVERSITIES.find((u) => u.id === profile.university_id) ?? MOCK_UNIVERSITIES[0] ?? null,
    faculty: MOCK_FACULTIES.find((f) => f.id === profile.faculty_id) ?? MOCK_FACULTIES[0] ?? null,
    department: MOCK_DEPARTMENTS.find((d) => d.id === profile.department_id) ?? MOCK_DEPARTMENTS[0] ?? null,
    academicLevel: MOCK_ACADEMIC_LEVELS.find((l) => l.id === profile.academic_level_id) ?? MOCK_ACADEMIC_LEVELS[2] ?? null,
  };
}

/**
 * Returns courses matching a student's department and academic level.
 */
export async function getStudentCourses(
  profile: ProfileRow | null
): Promise<CourseRow[]> {
  if (!profile) {
    return [];
  }

  if (isSupabaseConfigured() && profile.department_id) {
    try {
      const supabase = createClient();
      let query = supabase
        .from("courses")
        .select("*")
        .eq("department_id", profile.department_id)
        .eq("is_active", true)
        .order("code", { ascending: true });

      if (profile.academic_level_id) {
        query = query.eq("academic_level_id", profile.academic_level_id);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CourseRow[];
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to mock courses for the department / level or all active mock courses
  let matches = MOCK_COURSES.filter((c) => c.is_active);
  if (profile.department_id) {
    const deptMatches = matches.filter((c) => c.department_id === profile.department_id);
    if (deptMatches.length > 0) matches = deptMatches;
  }
  if (profile.academic_level_id) {
    const levelMatches = matches.filter((c) => c.academic_level_id === profile.academic_level_id);
    if (levelMatches.length > 0) matches = levelMatches;
  }
  return matches;
}
