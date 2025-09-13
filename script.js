// Global variables
const ADMIN_CODE = "1"; // Teacher's admin code
let isAdmin = false;
let currentUser = null;
let currentExam = null;
let examTimer = null;
let examTimeLeft = 0;
let currentQuestionIndex = 0;
let userAnswers = {};
let examHistory = JSON.parse(localStorage.getItem("examHistory")) || [];
let studentErrors = JSON.parse(localStorage.getItem("studentErrors")) || {};
let selectedDay = null; // For tracking form
let currentClass = "all"; // Current selected class
let zoomLevel = 1; // Zoom level for accessibility
let photoAchievements =
  JSON.parse(localStorage.getItem("photoAchievements")) || [];
let achievementFiles =
  JSON.parse(localStorage.getItem("achievementFiles")) || [];
let currentPhotoFilter = "all";
let currentModalImage = null; // For modal image handling

// Selected file for preview
let selectedFile = null;

// Initial data step

// Initialize student codes if not exists

// FIXED: New variables for improved exam management
let isEditing = false;
let editingExamId = null;
let currentExamData = null;
let examSaveInProgress = false; // NEW: Prevent multiple save operations
let saveAttempts = 0; // NEW: Track save attempts to prevent infinite loops
let lastSaveTime = 0; // NEW: Track last save time to prevent rapid saves

// Enhanced upload tracking for achievement files
let studentUploadCounts =
  JSON.parse(localStorage.getItem("studentUploadCounts")) || {};

// Worksheets data - only admin-created content
let worksheets = JSON.parse(localStorage.getItem("worksheets")) || [];

// Weekly plans data - only admin-created content
let weeklyPlans = JSON.parse(localStorage.getItem("weeklyPlans")) || [];

let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

// Clean students data - only admin-created content
let students = JSON.parse(localStorage.getItem("students")) || {
  week1: [],
  week2: [],
  week3: [],
};

// Clean exams data - only admin-created content
let exams = JSON.parse(localStorage.getItem("exams")) || [];

// ========== نظام الفلترة المحسن - بداية ==========

// وظيفة جديدة لتطبيق الفلترة التلقائية بناءً على المستخدم
function applyUserBasedFiltering() {
  if (!currentUser) {
    currentClass = "all";
    return;
  }

  if (isAdmin) {
    // المعلم يرى كل الفصول
    currentClass = "all";
    showClassFilterControls(true);
  } else {
    // الطالب يرى فصله فقط
    currentClass = currentUser.class;
    showClassFilterControls(false);
  }

  // تطبيق الفلترة فوراً
  filterContentByClass();
  updateClassFilterUI();
}

// وظيفة إخفاء/إظهار عناصر فلترة الصفوف
function showClassFilterControls(show) {
  const classFilter = document.querySelector(".class-filter");
  const classDropdowns = document.querySelectorAll(
    ".class-dropdown-button, .class-dropdown-menu"
  );
  const classTabs = document.querySelectorAll(".class-tab");
  const classSelectors = document.querySelectorAll(
    ".achievement-filter-btn, .class-selection-modern"
  );

  const elements = [
    classFilter,
    ...classDropdowns,
    ...classTabs,
    ...classSelectors,
  ].filter((el) => el);

  elements.forEach((element) => {
    if (show) {
      element.style.display = "";
      element.classList.remove("hidden");
    } else {
      element.style.display = "none";
      element.classList.add("hidden");
    }
  });
}

// وظيفة تحديث واجهة فلترة الصفوف
function updateClassFilterUI() {
  if (isAdmin) {
    // للمعلم - إظهار جميع خيارات الفلترة
    showAllClassFilterOptions();
  } else {
    // للطالب - إخفاء خيارات الفلترة وإظهار فصله فقط
    hideClassFilterOptions();
    showStudentClassInfo();
  }
}

function showAllClassFilterOptions() {
  const dropdownButton = document.querySelector(".class-dropdown-button");
  if (dropdownButton) {
    dropdownButton.style.display = "";
  }

  const filterButtons = document.querySelectorAll(".achievement-filter-btn");
  filterButtons.forEach((btn) => {
    btn.style.display = "";
  });
}

function hideClassFilterOptions() {
  const dropdownButton = document.querySelector(".class-dropdown-button");
  if (dropdownButton) {
    dropdownButton.style.display = "none";
  }

  // إخفاء أزرار فلترة الإنجازات للطلاب
  const filterButtons = document.querySelectorAll(".achievement-filter-btn");
  filterButtons.forEach((btn) => {
    if (
      btn.getAttribute("data-filter") !== currentClass &&
      btn.getAttribute("data-filter") !== "all"
    ) {
      btn.style.display = "none";
    }
  });
}

function showStudentClassInfo() {
  if (!currentUser || isAdmin) return;

  // إنشاء معلومات الصف للطالب
  const classInfo = document.createElement("div");
  classInfo.id = "studentClassInfo";
  classInfo.className =
    "bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center";
  classInfo.innerHTML = `
    <div class="flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <span class="text-blue-800 font-bold text-lg">صفك: ${getClassNameArabic(
        currentUser.class
      )}</span>
    </div>
    <p class="text-blue-600 text-sm mt-2">يتم عرض المحتوى الخاص بصفك فقط</p>
  `;

  // إضافة معلومات الصف في بداية كل قسم
  const sections = [
    "exams",
    "worksheets",
    "weeklyPlans",
    "achievementFiles",
    "photoAchievements",
    "excellentStudents",
  ];
  sections.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const existingInfo = section.querySelector("#studentClassInfo");
      if (existingInfo) {
        existingInfo.remove();
      }

      const firstChild = section.querySelector(".bg-white, .section");
      if (firstChild) {
        firstChild.parentNode.insertBefore(
          classInfo.cloneNode(true),
          firstChild
        );
      }
    }
  });
}

// تحسين وظيفة filterContentByClass لتطبيق الفلترة الذكية
function filterContentByClass() {
  // تحديد الفلتر المطلوب
  let classFilter = currentClass;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - فرض فلترة فصلهم فقط
    classFilter = currentUser.class;
    currentClass = classFilter; // تحديث المتغير العام
  }

  // تطبيق الفلترة على جميع المحتويات
  loadExams();
  loadWorksheets();
  loadWeeklyPlans();
  loadStudents();
  loadPhotoAchievements();
  loadAchievementFiles();
  loadReminders();

  console.log(
    `تم تطبيق فلترة الصف: ${classFilter} للمستخدم: ${
      currentUser?.name || "غير مسجل"
    }`
  );
}

// تحسين وظيفة selectClass للمعلمين فقط
function selectClass(className) {
  // فقط المعلم يمكنه تغيير الفلتر
  if (!isAdmin) {
    showNotification("عذراً، هذه الميزة متاحة للمعلم فقط", "warning");
    return;
  }

  currentClass = className;

  const selectedText = document.getElementById("selectedClassText");
  const menu = document.getElementById("classDropdownMenu");
  const arrow = document.getElementById("dropdownArrow");

  // تحديث النص المعروض
  const classNames = {
    all: "جميع الصفوف",
    class5A: "الخامس أ",
    class6D: "السادس د",
    class6H: "السادس هـ",
  };

  if (selectedText) {
    selectedText.textContent = classNames[className];
  }

  // إخفاء القائمة
  if (menu) menu.classList.remove("show");
  if (arrow) arrow.style.transform = "rotate(0deg)";

  // Filter content based on selected class
  filterContentByClass();
}

// وظيفة محسنة لفلترة الإنجازات المصورة
function filterPhotoAchievements(filter) {
  // للطلاب - منع تغيير الفلتر عن فصلهم
  if (!isAdmin && currentUser && currentUser.class) {
    if (filter !== currentUser.class && filter !== "all") {
      showNotification("يمكنك مشاهدة إنجازات صفك فقط", "info");
      return;
    }
    filter = currentUser.class;
  }

  currentPhotoFilter = filter;

  // Update filter buttons (للمعلم فقط)
  if (isAdmin) {
    document.querySelectorAll(".achievement-filter-btn").forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white");
      btn.classList.add("bg-gray-200", "text-gray-700");
    });

    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.add("bg-blue-600", "text-white");
      activeBtn.classList.remove("bg-gray-200", "text-gray-700");
    }
  }

  loadPhotoAchievements();
}

// ========== نظام الفلترة المحسن - نهاية ==========

// FIXED: Enhanced debounced save function to prevent rapid saves
function debouncedSave(saveFunction, delay = 1000) {
  const now = Date.now();
  if (now - lastSaveTime < delay) {
    return false; // Too soon, skip this save
  }
  lastSaveTime = now;
  return saveFunction();
}

// Enhanced file upload with preview functionality
function handleAchievementFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    showNotification("يرجى اختيار ملف صورة أو PDF صحيح", "error");
    input.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showNotification(
      "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 10MB",
      "error"
    );
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    input.fileData = e.target.result;
    selectedFile = {
      data: e.target.result,
      type: file.type,
      name: file.name,
      size: file.size,
    };

    showFilePreview(file, e.target.result);
    showNotification("تم اختيار الملف بنجاح!", "success");
  };
  reader.readAsDataURL(file);
}

function showFilePreview(file, fileData) {
  const uploadArea = document.getElementById("uploadAreaDefault");
  const previewArea = document.getElementById("filePreviewArea");
  const container = document.getElementById("achievementFileUploadArea");

  // Hide upload area and show preview
  uploadArea.classList.add("hidden");
  previewArea.classList.remove("hidden");
  container.classList.add("has-file");

  if (file.type.startsWith("image/")) {
    // Show image preview
    document.getElementById("imagePreview").classList.remove("hidden");
    document.getElementById("pdfPreview").classList.add("hidden");
    document.getElementById("previewImage").src = fileData;
  } else if (file.type === "application/pdf") {
    // Show PDF info
    document.getElementById("imagePreview").classList.add("hidden");
    document.getElementById("pdfPreview").classList.remove("hidden");
    document.getElementById("fileName").textContent = file.name;
    document.getElementById("fileSize").textContent = `الحجم: ${(
      file.size /
      1024 /
      1024
    ).toFixed(2)} MB`;
  }
}

function removeSelectedFile() {
  const uploadArea = document.getElementById("uploadAreaDefault");
  const previewArea = document.getElementById("filePreviewArea");
  const container = document.getElementById("achievementFileUploadArea");
  const fileInput = document.getElementById("achievementFileInput");

  // Reset everything
  uploadArea.classList.remove("hidden");
  previewArea.classList.add("hidden");
  container.classList.remove("has-file");
  fileInput.value = "";
  fileInput.fileData = null;
  selectedFile = null;

  showNotification("تم إزالة الملف", "info");
}

// Enhanced Upload Limit Functions for Achievement Files
function getStudentUploadCount(studentName) {
  return studentUploadCounts[studentName] || 0;
}

function updateStudentUploadCount(studentName) {
  if (!studentUploadCounts[studentName]) {
    studentUploadCounts[studentName] = 0;
  }
  studentUploadCounts[studentName]++;
  localStorage.setItem(
    "studentUploadCounts",
    JSON.stringify(studentUploadCounts)
  );
}

function updateUploadLimitDisplay() {
  if (!currentUser) return;

  const uploadCount = getStudentUploadCount(currentUser.name);
  const maxUploads = 2;

  // Update display elements
  const uploadCountText = document.getElementById("uploadCountText");
  const uploadProgressBar = document.getElementById("uploadProgressBar");
  const uploadStatusText = document.getElementById("uploadStatusText");
  const uploadForm = document.getElementById("uploadFormContainer");
  const uploadBlocked = document.getElementById("uploadBlockedMessage");
  const uploadBtn = document.getElementById("uploadAchievementBtn");

  if (uploadCountText) {
    uploadCountText.textContent = `${uploadCount} من ${maxUploads}`;
  }

  if (uploadProgressBar) {
    const percentage = (uploadCount / maxUploads) * 100;
    uploadProgressBar.style.width = `${percentage}%`;
  }

  if (uploadStatusText) {
    const remaining = maxUploads - uploadCount;
    if (remaining > 0) {
      uploadStatusText.textContent = `يمكنك رفع ${remaining} ملف${
        remaining === 1 ? "" : "ين"
      } إضافي${remaining === 1 ? "" : "ين"}`;
      uploadStatusText.className = "text-sm text-orange-600 mt-2";
    } else {
      uploadStatusText.textContent = "تم الوصول للحد الأقصى المسموح";
      uploadStatusText.className = "text-sm text-red-600 mt-2 font-bold";
    }
  }

  // Show/hide form based on upload count
  if (uploadCount >= maxUploads) {
    if (uploadForm) uploadForm.classList.add("hidden");
    if (uploadBlocked) uploadBlocked.classList.remove("hidden");
    if (uploadBtn) uploadBtn.disabled = true;
  } else {
    if (uploadForm) uploadForm.classList.remove("hidden");
    if (uploadBlocked) uploadBlocked.classList.add("hidden");
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

// FIXED: Mobile Navigation Functions
function toggleMobileNav() {
  const mobileMenu = document.getElementById("mobileNavMenu");
  mobileMenu.classList.add("active");
}

function closeMobileNav() {
  const mobileMenu = document.getElementById("mobileNavMenu");
  mobileMenu.classList.remove("active");
}

// FIXED: Enhanced Section Management with proper navigation state and filtering
function showSection(sectionName) {
  // Force page refresh for cache busting
  if (sectionName !== "home") {
    const timestamp = new Date().getTime();
    document.body.setAttribute("data-section-load", timestamp);
  }

  // Hide all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => section.classList.remove("active"));

  // Show selected section
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // FIXED: Update navigation state properly
  updateNavigationState(sectionName);

  // Load specific section content
  if (sectionName === "studentErrors") {
    loadSavedErrors();
  } else if (sectionName === "studentTracking") {
    // Show teacher panel if admin, otherwise hide it
    if (isAdmin) {
      document
        .getElementById("teacherManagementPanel")
        .classList.remove("hidden");
      loadTeacherStudentOptions();
    } else {
      document.getElementById("teacherManagementPanel").classList.add("hidden");
    }
  } else if (sectionName === "worksheets") {
    loadWorksheets();
    checkAdminSections();
  } else if (sectionName === "weeklyPlans") {
    loadWeeklyPlans();
    checkAdminSections();
  } else if (sectionName === "photoAchievements") {
    loadPhotoAchievements();
    checkAdminSections();
  } else if (sectionName === "achievementFiles") {
    loadAchievementFiles();
    checkAdminSections();
    updateUploadLimitDisplay();
  } else if (sectionName === "excellentStudents") {
    loadStudents();
    checkAdminSections();
  } else if (sectionName === "exams") {
    loadExams();
    checkAdminSections();
  } else if (sectionName === "reminders") {
    loadReminders();
    checkAdminSections();
  }

  // تطبيق الفلترة بناءً على المستخدم بعد تحميل المحتوى
  setTimeout(() => {
    applyUserBasedFiltering();
  }, 100);
}

// FIXED: New function to update navigation state
function updateNavigationState(sectionName) {
  // Remove active class from all nav items
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));

  // Add active class to current section
  const currentNavItem = document.getElementById(`nav-${sectionName}`);
  if (currentNavItem) {
    currentNavItem.classList.add("active");
  }

  // Handle dropdown items
  const dropdownSections = {
    weeklyPlans: "المحتوى التعليمي",
    worksheets: "المحتوى التعليمي",
    madrasatiPlatform: "المنصات والمتابعة",
    studentTracking: "المنصات والمتابعة",
    excellentStudents: "الطلاب والإنجازات",
    photoAchievements: "الطلاب والإنجازات",
  };

  if (dropdownSections[sectionName]) {
    // Find and activate the parent dropdown
    const dropdowns = document.querySelectorAll(".nav-dropdown");
    dropdowns.forEach((dropdown) => {
      const dropdownText = dropdown
        .querySelector(".nav-item")
        .textContent.trim();
      if (dropdownText.includes(dropdownSections[sectionName])) {
        dropdown.querySelector(".nav-item").classList.add("active");
      }
    });
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Force refresh to ensure latest content
  if (
    performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD
  ) {
    location.reload(true);
  }

  initializeHijriDates();
  loadLatestReminders();
  loadExams();
  loadStudents();
  loadReminders();
  loadExamHistory();
  loadSavedErrors();
  loadWorksheets();
  loadWeeklyPlans();
  loadPhotoAchievements();
  loadAchievementFiles();
  updateZoomLevel();
  updateUploadLimitDisplay();

  // Save initial data
  localStorage.setItem("studentCodes", JSON.stringify(studentCodes));
  localStorage.setItem("studentTracking", JSON.stringify(studentTracking));
  localStorage.setItem("worksheets", JSON.stringify(worksheets));
  localStorage.setItem("weeklyPlans", JSON.stringify(weeklyPlans));
  localStorage.setItem("students", JSON.stringify(students));
  localStorage.setItem("photoAchievements", JSON.stringify(photoAchievements));
  localStorage.setItem("achievementFiles", JSON.stringify(achievementFiles));
  localStorage.setItem(
    "studentUploadCounts",
    JSON.stringify(studentUploadCounts)
  );

  // Show teacher upload sections if admin
  checkAdminSections();

  // Show teacher management panel if admin
  if (isAdmin) {
    document
      .getElementById("teacherManagementPanel")
      .classList.remove("hidden");
    loadTeacherStudentOptions();
  }

  // Initialize seasonal banner
  initializeSeasonalBanner();

  // Add cache-busting parameter to all resources
  const timestamp = new Date().getTime();
  document.documentElement.setAttribute("data-cache-buster", timestamp);

  // Check for scheduled exams
  checkScheduledExams();

  // FIXED: Add click outside listener for dropdowns
  document.addEventListener("click", function (event) {
    const dropdowns = document.querySelectorAll(".nav-dropdown");
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("active");
      }
    });
  });

  // تطبيق الفلترة التلقائية عند تحميل الصفحة
  setTimeout(() => {
    applyUserBasedFiltering();
  }, 500);
});

// New function to check and publish scheduled exams
function checkScheduledExams() {
  const now = new Date();
  let hasUpdates = false;

  exams.forEach((exam) => {
    if (!exam.isPublished && exam.publishDate && exam.publishTime) {
      const publishDateTime = new Date(
        `${exam.publishDate}T${exam.publishTime}`
      );

      if (now >= publishDateTime) {
        exam.isPublished = true;
        exam.status = "published";
        hasUpdates = true;

        if (isAdmin) {
          showNotification(`تم نشر الاختبار: ${exam.title}`, "success");
        }
      }
    }
  });

  if (hasUpdates) {
    localStorage.setItem("exams", JSON.stringify(exams));
    loadExams();
  }
}

// Seasonal Banner Functions
function initializeSeasonalBanner() {
  const banner = document.getElementById("seasonalBanner");
  const featuredStudents = document.getElementById("featuredStudents");

  // Get some featured students from admin-created data
  const weekStudents = students.week1 || [];
  if (weekStudents.length > 0) {
    featuredStudents.innerHTML = "";
    weekStudents.slice(0, 2).forEach((student) => {
      const studentDiv = document.createElement("div");
      studentDiv.className = "bg-white bg-opacity-20 rounded-lg p-2";
      studentDiv.innerHTML = `<span class="font-bold">${
        student.name
      }</span> - ${getClassNameArabic(student.class)}`;
      featuredStudents.appendChild(studentDiv);
    });
  } else {
    // Show placeholder if no students added by admin
    featuredStudents.innerHTML = `
      <div class="bg-white bg-opacity-20 rounded-lg p-2">
        <span class="font-bold">لم يتم إضافة طلاب متميزين بعد</span>
      </div>
    `;
  }

  // Show banner with animation
  setTimeout(() => {
    banner.style.opacity = "1";
    banner.style.transform = "rotate(5deg)";
  }, 1000);
}

function closeBanner() {
  const banner = document.getElementById("seasonalBanner");
  banner.style.opacity = "0";
  banner.style.transform = "rotate(5deg) translateY(-20px)";
  setTimeout(() => {
    banner.style.display = "none";
  }, 300);
}

// Featured Students Design Management Functions
function updateDesignImage() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const newImageUrl = document.getElementById("designImageUrl").value.trim();
  if (!newImageUrl) {
    showNotification("يرجى إدخال رابط الصورة", "error");
    return;
  }

  // Update the design preview
  const designPreview = document.querySelector(".design-preview");
  if (designPreview) {
    designPreview.src = newImageUrl;

    // Save to localStorage
    localStorage.setItem("customDesignImage", newImageUrl);

    showNotification("تم تحديث التصميم بنجاح!", "success");
    document.getElementById("designImageUrl").value = "";
  }
}

function resetToDefault() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const defaultImage =
    "https://dhiwise-assets.s3.ap-south-1.amazonaws.com/uploadAttachments/________-3-1755405029362.jpg";

  const designPreview = document.querySelector(".design-preview");
  if (designPreview) {
    designPreview.src = defaultImage;

    // Remove from localStorage
    localStorage.removeItem("customDesignImage");

    showNotification("تم إعادة تعيين التصميم للافتراضي", "info");
  }
}

function uploadAchievementFile() {
  const studentName = document
    .getElementById("studentAchievementName")
    .value.trim();
  const studentClass = document.getElementById("studentAchievementClass").value;
  const title = document.getElementById("studentAchievementTitle").value.trim();
  const description = document
    .getElementById("studentAchievementDescription")
    .value.trim();
  const fileInput = document.getElementById("achievementFileInput");

  if (
    !studentName ||
    !studentClass ||
    !title ||
    !description ||
    !fileInput.fileData
  ) {
    showNotification("يرجى ملء جميع الحقول واختيار ملف", "error");
    return;
  }

  // Check upload limit
  const currentUploadCount = getStudentUploadCount(studentName);
  if (currentUploadCount >= 2) {
    showNotification("لقد وصلت للحد الأقصى المسموح (ملفين لكل طالب)", "error");
    return;
  }

  const newAchievementFile = {
    id: Date.now(),
    studentName: studentName,
    class: studentClass,
    title: title,
    description: description,
    fileData: fileInput.fileData,
    fileType: fileInput.files[0].type,
    fileName: fileInput.files[0].name,
    status: "pending", // pending, approved, rejected
    rating: 0,
    submissionDate: new Date().toLocaleDateString("ar-SA"),
    approvedDate: null,
    teacherComment: "",
  };

  achievementFiles.push(newAchievementFile);
  localStorage.setItem("achievementFiles", JSON.stringify(achievementFiles));

  // Update upload count
  updateStudentUploadCount(studentName);
  updateUploadLimitDisplay();

  // Clear form
  document.getElementById("studentAchievementName").value = "";
  document.getElementById("studentAchievementClass").value = "";
  document.getElementById("studentAchievementTitle").value = "";
  document.getElementById("studentAchievementDescription").value = "";
  document.getElementById("achievementFileInput").value = "";

  // Reset file preview
  removeSelectedFile();

  loadAchievementFiles();

  // Enhanced success notification with upload count
  const remainingUploads = 2 - getStudentUploadCount(studentName);
  let message = "تم رفع ملف الإنجاز بنجاح! في انتظار مراجعة المعلم";
  if (remainingUploads > 0) {
    message += ` - يمكنك رفع ${remainingUploads} ملف${
      remainingUploads === 1 ? "" : "ين"
    } إضافي${remainingUploads === 1 ? "" : "ين"}`;
  } else {
    message += " - تم الوصول للحد الأقصى المسموح";
  }

  showNotification(message, "success");
}

function loadAchievementFiles() {
  loadPendingAchievements();
  loadPublishedAchievements();
  updateUploadLimitDisplay();
}

function loadPendingAchievements() {
  if (!isAdmin) return;

  const container = document.getElementById("pendingAchievements");
  if (!container) return;

  const pendingFiles = achievementFiles.filter(
    (file) => file.status === "pending"
  );

  container.innerHTML = "";

  if (pendingFiles.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-green-700 text-lg">لا توجد ملفات إنجاز في انتظار المراجعة</p>
      </div>
    `;
    return;
  }

  pendingFiles.forEach((file) => {
    const fileHtml = `
      <div class="bg-white rounded-xl p-6 border border-gray-200 achievement-file-card">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800">${file.title}</h4>
            <p class="text-gray-600">الطالب: ${
              file.studentName
            } - ${getClassNameArabic(file.class)}</p>
            <p class="text-sm text-gray-500">تاريخ الرفع: ${
              file.submissionDate
            }</p>
          </div>
          <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            ⏳ في الانتظار
          </span>
        </div>
        
        <p class="text-gray-700 mb-4">${file.description}</p>
        
        <div class="mb-4">
          ${
            file.fileType.startsWith("image/")
              ? `<img src="${file.fileData}" class="file-preview" onclick="showImageModal('${file.fileData}')" />`
              : `<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="font-medium">${file.fileName}</span>
            </div>`
          }
        </div>
        
        <div class="flex items-center mb-4">
          <span class="ml-3 font-medium">التقييم:</span>
          <div class="rating-stars">
            ${[1, 2, 3, 4, 5]
              .map(
                (star) =>
                  `<svg class="star" data-rating="${star}" onclick="setRating(${file.id}, ${star})" 
                   xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
               </svg>`
              )
              .join("")}
          </div>
        </div>
        
        <textarea 
          id="comment-${file.id}" 
          placeholder="تعليق المعلم (اختياري)..." 
          rows="2" 
          class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        ></textarea>
        
        <div class="flex gap-3">
          <button onclick="approveAchievementFile(${file.id})" 
                  class="success-gradient text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
            ✅ اعتماد ونشر
          </button>
          <button onclick="rejectAchievementFile(${file.id})" 
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
            ❌ رفض
          </button>
        </div>
      </div>
    `;
    container.innerHTML += fileHtml;
  });
}

function loadPublishedAchievements() {
  const container = document.getElementById("publishedAchievements");
  if (!container) return;

  const publishedFiles = achievementFiles.filter(
    (file) => file.status === "approved"
  );

  // ENHANCED: تطبيق فلترة ذكية بناءً على المستخدم
  let filteredFiles = publishedFiles;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض فصلهم فقط
    filteredFiles = publishedFiles.filter(
      (file) => file.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    // للمعلم - عرض الصف المختار
    filteredFiles = publishedFiles.filter(
      (file) => file.class === currentClass
    );
  }

  container.innerHTML = "";

  if (filteredFiles.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          ${
            !isAdmin && currentUser
              ? `لا توجد إنجازات معتمدة لصف ${getClassNameArabic(
                  currentUser.class
                )} بعد`
              : "لا توجد إنجازات معتمدة بعد"
          }
        </h3>
        <p class="text-gray-500 text-lg">سيتم عرض الإنجازات المعتمدة هنا</p>
      </div>
    `;
    return;
  }

  filteredFiles.forEach((file) => {
    const starsHtml = [1, 2, 3, 4, 5]
      .map(
        (star) =>
          `<svg class="w-5 h-5 ${
            star <= file.rating ? "text-yellow-400" : "text-gray-300"
          }" 
           xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
         <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
       </svg>`
      )
      .join("");

    const fileHtml = `
      <div class="achievement-file-card rounded-xl p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800">${file.title}</h4>
            <p class="text-gray-600">الطالب: ${file.studentName}</p>
            <p class="text-sm text-gray-500">${getClassNameArabic(
              file.class
            )} - ${file.approvedDate}</p>
          </div>
          <div class="flex items-center">
            ${starsHtml}
          </div>
        </div>
        
        <p class="text-gray-700 mb-4">${file.description}</p>
        
        <div class="mb-4">
          ${
            file.fileType.startsWith("image/")
              ? `<img src="${file.fileData}" class="file-preview" onclick="showImageModal('${file.fileData}')" />`
              : `<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-center cursor-pointer" onclick="downloadFile('${file.fileData}', '${file.fileName}')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="font-medium">${file.fileName}</span>
            </div>`
          }
        </div>
        
        ${
          file.teacherComment
            ? `<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p class="text-blue-800"><strong>تعليق المعلم:</strong> ${file.teacherComment}</p>
          </div>`
            : ""
        }
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">⭐ تقييم المعلم: ${
            file.rating
          }/5</span>
          <button onclick="printAchievementFile(${file.id})" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
            🖨️ طباعة
          </button>
        </div>
      </div>
    `;
    container.innerHTML += fileHtml;
  });
}

function setRating(fileId, rating) {
  // Update star display
  const stars = document.querySelectorAll(`[data-rating]`);
  stars.forEach((star) => {
    const starRating = parseInt(star.getAttribute("data-rating"));
    if (starRating <= rating) {
      star.classList.add("filled");
    } else {
      star.classList.remove("filled");
    }
  });

  // Store rating temporarily (will be saved when approving)
  window.tempRating = rating;
}

function approveAchievementFile(fileId) {
  if (!isAdmin) return;

  const file = achievementFiles.find((f) => f.id === fileId);
  if (!file) return;

  const comment = document.getElementById(`comment-${fileId}`).value.trim();
  const rating = window.tempRating || 5;

  file.status = "approved";
  file.rating = rating;
  file.teacherComment = comment;
  file.approvedDate = new Date().toLocaleDateString("ar-SA");

  localStorage.setItem("achievementFiles", JSON.stringify(achievementFiles));

  loadAchievementFiles();
  showNotification("تم اعتماد ملف الإنجاز ونشره بنجاح!", "success");
}

function rejectAchievementFile(fileId) {
  if (!isAdmin) return;

  const comment = document.getElementById(`comment-${fileId}`).value.trim();

  if (!comment) {
    showNotification("يرجى كتابة تعليق يوضح سبب الرفض", "error");
    return;
  }

  const file = achievementFiles.find((f) => f.id === fileId);
  if (!file) return;

  file.status = "rejected";
  file.teacherComment = comment;

  // Decrease upload count when rejecting
  if (studentUploadCounts[file.studentName] > 0) {
    studentUploadCounts[file.studentName]--;
    localStorage.setItem(
      "studentUploadCounts",
      JSON.stringify(studentUploadCounts)
    );
  }

  localStorage.setItem("achievementFiles", JSON.stringify(achievementFiles));

  loadAchievementFiles();
  showNotification("تم رفض ملف الإنجاز مع إرسال تعليق للطالب", "info");
}

function printAchievementFile(fileId) {
  const file = achievementFiles.find((f) => f.id === fileId);
  if (!file) return;

  const starsText = "⭐".repeat(file.rating);

  let printContent = `
    <html dir="rtl">
    <head>
      <title>ملف إنجاز - ${file.title}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; margin: 40px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 30px; margin-bottom: 40px; }
        .title { color: #1E40AF; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
        .student-info { color: #6B7280; margin: 10px 0; font-size: 18px; }
        .description { background: #F3F4F6; padding: 30px; border-radius: 15px; margin: 30px 0; font-size: 18px; line-height: 2; }
        .rating { background: #FEF3C7; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center; }
        .comment { background: #DBEAFE; padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 5px solid #3B82F6; }
        .footer { margin-top: 50px; text-align: center; color: #6B7280; border-top: 2px solid #E5E7EB; padding-top: 30px; }
        .cert-style { border: 5px solid #3B82F6; border-radius: 20px; padding: 40px; margin: 30px 0; background: #F8FAFC; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">🏆 ملف الإنجاز المعتمد</div>
        <div class="student-info">الطالب: <strong>${
          file.studentName
        }</strong></div>
        <div class="student-info">الصف: <strong>${getClassNameArabic(
          file.class
        )}</strong></div>
        <div class="student-info">تاريخ الاعتماد: <strong>${
          file.approvedDate
        }</strong></div>
      </div>
      
      <div class="cert-style">
        <h2 style="color: #1E40AF; text-align: center; margin-bottom: 30px;">${
          file.title
        }</h2>
        
        <div class="description">
          <h3 style="color: #374151; margin-bottom: 20px;">📝 وصف الإنجاز:</h3>
          <p>${file.description}</p>
        </div>
        
        <div class="rating">
          <h3 style="color: #92400E; margin-bottom: 15px;">⭐ تقييم المعلم</h3>
          <div style="font-size: 24px; margin: 15px 0;">${starsText} (${
    file.rating
  }/5)</div>
        </div>
        
        ${
          file.teacherComment
            ? `
          <div class="comment">
            <h3 style="color: #1E40AF; margin-bottom: 15px;">💬 تعليق المعلم:</h3>
            <p style="font-size: 16px; line-height: 1.8;">${file.teacherComment}</p>
          </div>
        `
            : ""
        }
      </div>
      
      <div class="footer">
        <p style="font-size: 20px; font-weight: bold; color: #3B82F6;">موقع الأستاذ علي العيسني للرياضيات</p>
        <p>ملف إنجاز معتمد ومُقيّم</p>
        <p style="font-style: italic; color: #9CA3AF;">طُبع بتاريخ: ${new Date().toLocaleDateString(
          "ar-SA"
        )}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();

  showNotification("تم إعداد ملف الإنجاز للطباعة!", "success");
}

function downloadFile(fileData, fileName) {
  const link = document.createElement("a");
  link.href = fileData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification(`تم تحميل ${fileName}`, "success");
}

// Enhanced Photo Achievements Functions with External Text and Comments
function loadPhotoAchievements() {
  const container = document.getElementById("photoAchievementsList");
  if (!container) return;

  container.innerHTML = "";

  if (photoAchievements.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">لا توجد إنجازات مصورة بعد</h3>
        <p class="text-gray-500 text-lg">سيتم إضافة الإنجازات قريباً من قبل المعلم</p>
      </div>
    `;
    return;
  }

  // ENHANCED: تطبيق فلترة ذكية للإنجازات المصورة
  let filteredAchievements = photoAchievements;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض إنجازات فصلهم فقط
    filteredAchievements = photoAchievements.filter(
      (achievement) => achievement.class === currentUser.class
    );
  } else if (isAdmin && currentPhotoFilter !== "all") {
    // للمعلم - تطبيق الفلتر المختار
    filteredAchievements = photoAchievements.filter(
      (achievement) => achievement.class === currentPhotoFilter
    );
  }

  if (filteredAchievements.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          ${
            !isAdmin && currentUser
              ? `لا توجد إنجازات مصورة لصف ${getClassNameArabic(
                  currentUser.class
                )} بعد`
              : "لا توجد إنجازات مصورة بعد"
          }
        </h3>
        <p class="text-gray-500 text-lg">سيتم إضافة الإنجازات قريباً</p>
      </div>
    `;
    return;
  }

  filteredAchievements.forEach((achievement) => {
    const classNameArabic = getClassNameArabic(achievement.class);

    const achievementHtml = `
      <div class="photo-achievement-external">
        <div class="mb-6">
          <img src="${achievement.imageData}" alt="${achievement.title}" 
               onclick="showImageModal('${achievement.imageData}')" 
               class="achievement-image" />
        </div>
        
        <div class="mb-4">
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-xl font-bold text-gray-800">${
              achievement.title
            }</h3>
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ${classNameArabic}
            </span>
          </div>
          <p class="text-gray-700 mb-3 leading-relaxed">${
            achievement.description
          }</p>
          <p class="text-sm text-gray-500">📅 ${achievement.date}</p>
        </div>
        
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-4">
            <h4 class="font-bold text-gray-800">التفاعلات</h4>
            <div class="flex gap-2">
              <button onclick="printPhotoAchievement(${achievement.id})" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-all">
                🖨️ طباعة
              </button>
              <button onclick="downloadPhotoAchievement(${achievement.id})" 
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-all">
                💾 تحميل
              </button>
            </div>
          </div>
          
          <div class="flex gap-2 mb-4">
            <button onclick="addReaction(${achievement.id}, '👏')" 
                    class="reaction-button ${
                      achievement.reactions && achievement.reactions["👏"]
                        ? "active"
                        : ""
                    }"
                    style="background: rgba(59, 130, 246, 0.1); border: 2px solid rgba(59, 130, 246, 0.3); color: #1e40af;">
              👏 ${achievement.reactions ? achievement.reactions["👏"] || 0 : 0}
            </button>
            <button onclick="addReaction(${achievement.id}, '❤️')" 
                    class="reaction-button ${
                      achievement.reactions && achievement.reactions["❤️"]
                        ? "active"
                        : ""
                    }"
                    style="background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); color: #dc2626;">
              ❤️ ${achievement.reactions ? achievement.reactions["❤️"] || 0 : 0}
            </button>
            <button onclick="addReaction(${achievement.id}, '🌟')" 
                    class="reaction-button ${
                      achievement.reactions && achievement.reactions["🌟"]
                        ? "active"
                        : ""
                    }"
                    style="background: rgba(245, 158, 11, 0.1); border: 2px solid rgba(245, 158, 11, 0.3); color: #d97706;">
              🌟 ${achievement.reactions ? achievement.reactions["🌟"] || 0 : 0}
            </button>
          </div>
          
          <div class="comment-thread">
            <h5 class="font-medium text-gray-800 mb-3">💬 التعليقات</h5>
            <div id="comments-${achievement.id}" class="space-y-2 mb-3">
              ${
                achievement.comments
                  ? achievement.comments
                      .map(
                        (comment) => `
                <div class="comment-item">
                  <div class="flex justify-between items-start">
                    <span class="font-medium text-gray-800">${comment.author}</span>
                    <span class="text-xs text-gray-500">${comment.date}</span>
                  </div>
                  <p class="text-gray-700 mt-1">${comment.text}</p>
                </div>
              `
                      )
                      .join("")
                  : '<p class="text-gray-500 text-sm">لا توجد تعليقات بعد</p>'
              }
            </div>
            
            <div class="flex gap-2">
              <input type="text" 
                     id="comment-input-${achievement.id}" 
                     placeholder="اكتب تعليقك هنا..." 
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     onkeypress="if(event.key==='Enter') addComment(${
                       achievement.id
                     })">
              <button onclick="addComment(${achievement.id})" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                إرسال
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += achievementHtml;
  });
}

function downloadPhotoAchievement(achievementId) {
  const achievement = photoAchievements.find((a) => a.id === achievementId);
  if (!achievement) return;

  const link = document.createElement("a");
  link.href = achievement.imageData;
  link.download = `${achievement.title}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification("تم تحميل الصورة بنجاح!", "success");
}

// ENHANCED: تحسين فلترة الإنجازات المصورة مع مراعاة نوع المستخدم
function filterPhotoAchievements(filter) {
  // للطلاب - منع تغيير الفلتر عن فصلهم
  if (!isAdmin && currentUser && currentUser.class) {
    if (filter !== currentUser.class && filter !== "all") {
      showNotification("يمكنك مشاهدة إنجازات صفك فقط", "info");
      return;
    }
    filter = currentUser.class;
  }

  currentPhotoFilter = filter;

  // Update filter buttons (للمعلم فقط)
  if (isAdmin) {
    document.querySelectorAll(".achievement-filter-btn").forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white");
      btn.classList.add("bg-gray-200", "text-gray-700");
    });

    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.add("bg-blue-600", "text-white");
      activeBtn.classList.remove("bg-gray-200", "text-gray-700");
    }
  }

  loadPhotoAchievements();
}

function addComment(achievementId) {
  const input = document.getElementById(`comment-input-${achievementId}`);
  const commentText = input.value.trim();

  if (!commentText) {
    showNotification("يرجى كتابة تعليق أولاً", "error");
    return;
  }

  const achievement = photoAchievements.find((a) => a.id === achievementId);
  if (!achievement) return;

  if (!achievement.comments) {
    achievement.comments = [];
  }

  const newComment = {
    id: Date.now(),
    author: currentUser ? currentUser.name : "ضيف",
    text: commentText,
    date: new Date().toLocaleDateString("ar-SA"),
  };

  achievement.comments.push(newComment);
  localStorage.setItem("photoAchievements", JSON.stringify(photoAchievements));

  input.value = "";
  loadPhotoAchievements();
  showNotification("تم إضافة التعليق بنجاح!", "success");
}

function printPhotoAchievement(achievementId) {
  const achievement = photoAchievements.find((a) => a.id === achievementId);
  if (!achievement) return;

  const totalReactions = achievement.reactions
    ? Object.values(achievement.reactions).reduce(
        (sum, count) => sum + count,
        0
      )
    : 0;

  const commentsHtml = achievement.comments
    ? achievement.comments
        .map(
          (comment) => `
      <div style="margin: 15px 0; padding: 15px; background: #F9FAFB; border-radius: 8px;">
        <div style="font-weight: bold; color: #374151; margin-bottom: 5px;">${comment.author} - ${comment.date}</div>
        <p style="color: #6B7280;">${comment.text}</p>
      </div>
    `
        )
        .join("")
    : '<p style="color: #9CA3AF;">لا توجد تعليقات</p>';

  let printContent = `
    <html dir="rtl">
    <head>
      <title>إنجاز مصور - ${achievement.title}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; margin: 30px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 25px; margin-bottom: 35px; }
        .title { color: #1E40AF; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
        .subtitle { color: #6B7280; margin-bottom: 12px; font-size: 16px; }
        .description { background: #F3F4F6; padding: 25px; border-radius: 12px; margin: 25px 0; font-size: 16px; line-height: 1.8; }
        .reactions { background: #EFF6FF; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .comments { background: #F0FDF4; padding: 25px; border-radius: 12px; margin: 25px 0; }
        .footer { margin-top: 40px; text-align: center; color: #6B7280; border-top: 2px solid #E5E7EB; padding-top: 25px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">📸 ${achievement.title}</div>
        <div class="subtitle">الصف: ${getClassNameArabic(
          achievement.class
        )}</div>
        <div class="subtitle">تاريخ النشر: ${achievement.date}</div>
      </div>
      
      <div class="description">
        <h3 style="color: #374151; margin-bottom: 15px;">📝 وصف الإنجاز:</h3>
        <p>${achievement.description}</p>
      </div>
      
      <div class="reactions">
        <h3 style="color: #1E40AF; margin-bottom: 15px;">✨ التفاعلات</h3>
        <p style="font-size: 18px;">
          👏 ${achievement.reactions ? achievement.reactions["👏"] || 0 : 0} • 
          ❤️ ${achievement.reactions ? achievement.reactions["❤️"] || 0 : 0} • 
          🌟 ${achievement.reactions ? achievement.reactions["🌟"] || 0 : 0}
        </p>
        <p style="color: #6B7280; margin-top: 10px;">إجمالي التفاعلات: ${totalReactions}</p>
      </div>
      
      <div class="comments">
        <h3 style="color: #16A34A; margin-bottom: 20px;">💬 التعليقات (${
          achievement.comments ? achievement.comments.length : 0
        })</h3>
        ${commentsHtml}
      </div>
      
      <div class="footer">
        <p style="font-size: 18px; font-weight: bold; color: #3B82F6;">موقع الأستاذ علي العيسني للرياضيات</p>
        <p>إنجاز مصور مع التفاعلات والتعليقات</p>
        <p style="font-style: italic; color: #9CA3AF;">طُبع بتاريخ: ${new Date().toLocaleDateString(
          "ar-SA"
        )}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();

  showNotification("تم إعداد الإنجاز للطباعة!", "success");
}

// Enhanced Timer Functions with Warnings
function startExamTimer() {
  examTimer = setInterval(() => {
    examTimeLeft--;
    const timerDisplay = document.getElementById("timerDisplay");
    const timerElement = document.getElementById("examTimer");

    if (timerDisplay && timerElement) {
      timerDisplay.textContent = formatTime(examTimeLeft);

      // Enhanced timer warnings
      if (examTimeLeft <= 30) {
        // Critical warning - last 30 seconds
        timerElement.className = timerElement.className.replace(
          /bg-\w+-\d+/g,
          ""
        );
        timerElement.className = timerElement.className.replace(
          /text-\w+-\d+/g,
          ""
        );
        timerElement.classList.add("timer-critical");

        if (examTimeLeft === 30) {
          showTimerAlert(
            "⚠️ تحذير نهائي!",
            "باقي 30 ثانية فقط لإنهاء الاختبار!",
            "error"
          );
        }
      } else if (examTimeLeft <= 120) {
        // Warning - last 2 minutes
        timerElement.className = timerElement.className.replace(
          /bg-\w+-\d+/g,
          ""
        );
        timerElement.className = timerElement.className.replace(
          /text-\w+-\d+/g,
          ""
        );
        timerElement.classList.add("timer-warning");

        if (examTimeLeft === 120) {
          showTimerAlert(
            "⏰ تنبيه",
            "باقي دقيقتان فقط! أسرع في الإجابة",
            "warning"
          );
        }
      } else if (examTimeLeft <= 300) {
        // Caution - last 5 minutes
        timerElement.className = timerElement.className.replace(
          /bg-blue-100 text-blue-800/g,
          ""
        );
        timerElement.classList.add("bg-yellow-100", "text-yellow-800");

        if (examTimeLeft === 300) {
          showTimerAlert(
            "📢 انتبه",
            "باقي 5 دقائق على انتهاء الاختبار",
            "info"
          );
        }
      }
    }

    if (examTimeLeft <= 0) {
      finishExam();
    }
  }, 1000);
}

function showTimerAlert(title, message, type) {
  Swal.fire({
    title: title,
    text: message,
    icon: type,
    timer: 3000,
    timerProgressBar: true,
    position: "top-end",
    toast: true,
    showConfirmButton: false,
    background:
      type === "error" ? "#fee2e2" : type === "warning" ? "#fef3c7" : "#dbeafe",
    color:
      type === "error" ? "#991b1b" : type === "warning" ? "#92400e" : "#1e40af",
  });
}

// Hijri Date Functions
function initializeHijriDates() {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
  const hijriMonths = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الثاني",
    "جمادى الأولى",
    "جمادى الثانية",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];

  const today = new Date();

  days.forEach((day, index) => {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - today.getDay() + index);

    // Simple Hijri calculation (approximate)
    const hijriDate = convertToHijri(dayDate);
    const element = document.getElementById(`${day}-hijri`);
    if (element) {
      element.textContent = `${hijriDate.day} ${
        hijriMonths[hijriDate.month - 1]
      }`;
    }
  });
}

function convertToHijri(gregorianDate) {
  // Simplified Hijri conversion (approximate)
  const hijriEpoch = new Date(622, 6, 16); // July 16, 622 CE
  const daysDiff = Math.floor(
    (gregorianDate - hijriEpoch) / (1000 * 60 * 60 * 24)
  );
  const hijriYear = Math.floor(daysDiff / 354) + 1;
  const dayOfYear = daysDiff % 354;
  const hijriMonth = Math.floor(dayOfYear / 29.5) + 1;
  const hijriDay = Math.floor(dayOfYear % 29.5) + 1;

  return {
    year: hijriYear,
    month: Math.min(hijriMonth, 12),
    day: Math.min(hijriDay, 30),
  };
}

// تحسين Class Selection Functions
function toggleClassDropdown() {
  // السماح للمعلم فقط بفتح القائمة
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "warning");
    return;
  }

  const menu = document.getElementById("classDropdownMenu");
  const arrow = document.getElementById("dropdownArrow");

  if (menu.classList.contains("show")) {
    menu.classList.remove("show");
    arrow.style.transform = "rotate(0deg)";
  } else {
    menu.classList.add("show");
    arrow.style.transform = "rotate(180deg)";
  }
}

function getClassNameArabic(className) {
  const classNames = {
    class5A: "الخامس أ",
    class6D: "السادس د",
    class6H: "السادس هـ",
  };
  return classNames[className] || className;
}

// Zoom Functions
function zoomIn() {
  if (zoomLevel < 1.5) {
    zoomLevel += 0.1;
    updateZoomLevel();
  }
}

function zoomOut() {
  if (zoomLevel > 0.7) {
    zoomLevel -= 0.1;
    updateZoomLevel();
  }
}

function updateZoomLevel() {
  document.body.style.zoom = zoomLevel;
  document.getElementById("zoomLevel").textContent =
    Math.round(zoomLevel * 100) + "%";
}

// Enhanced Image Modal Functions
function showImageModal(imageSrc) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = imageSrc;
  currentModalImage = imageSrc;
  modal.classList.add("active");
}

function closeImageModal() {
  document.getElementById("imageModal").classList.remove("active");
  currentModalImage = null;
}

function downloadModalImage() {
  if (!currentModalImage) return;

  const link = document.createElement("a");
  link.href = currentModalImage;
  link.download = `صورة_${new Date().getTime()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification("تم تحميل الصورة بنجاح!", "success");
}

function printModalImage() {
  if (!currentModalImage) return;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>طباعة الصورة</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        img { max-width: 100%; max-height: 100%; object-fit: contain; }
      </style>
    </head>
    <body>
      <img src="${currentModalImage}" onload="window.print(); window.close();" />
    </body>
    </html>
  `);
}

function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showNotification("يرجى اختيار ملف صورة صحيح", "error");
    input.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showNotification(
      "حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5MB",
      "error"
    );
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    input.fileData = e.target.result;
    showNotification("تم اختيار الصورة بنجاح!", "success");
  };
  reader.readAsDataURL(file);
}

function uploadPhotoAchievement() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const title = document.getElementById("achievementTitle").value.trim();
  const achievementClass = document.getElementById("achievementClass").value;
  const description = document
    .getElementById("achievementDescription")
    .value.trim();
  const fileInput = document.getElementById("achievementPhoto");

  if (!title || !achievementClass || !description || !fileInput.fileData) {
    showNotification("يرجى ملء جميع الحقول واختيار صورة", "error");
    return;
  }

  const newAchievement = {
    id: Date.now(),
    title: title,
    description: description,
    class: achievementClass,
    imageData: fileInput.fileData,
    date: new Date().toLocaleDateString("ar-SA"),
    reactions: {},
    comments: [],
  };

  photoAchievements.unshift(newAchievement);
  localStorage.setItem("photoAchievements", JSON.stringify(photoAchievements));

  // Clear form
  document.getElementById("achievementTitle").value = "";
  document.getElementById("achievementClass").value = "";
  document.getElementById("achievementDescription").value = "";
  document.getElementById("achievementPhoto").value = "";

  loadPhotoAchievements();
  showNotification("تم نشر الإنجاز بنجاح!", "success");
}

function addReaction(achievementId, emoji) {
  const achievement = photoAchievements.find((a) => a.id === achievementId);
  if (!achievement) return;

  if (!achievement.reactions) {
    achievement.reactions = {};
  }

  if (!achievement.reactions[emoji]) {
    achievement.reactions[emoji] = 0;
  }

  achievement.reactions[emoji]++;
  localStorage.setItem("photoAchievements", JSON.stringify(photoAchievements));

  loadPhotoAchievements();
  showNotification("تم إضافة التفاعل!", "success");
}

// Quick Tests Functions for Teacher
function showQuickTestsEntry() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const selectedClass = document.getElementById("teacherClassSelect").value;
  const testType = document.getElementById("quickTestType").value;
  const testName = document.getElementById("quickTestName").value.trim();

  if (!selectedClass || !testName) {
    showNotification("يرجى اختيار الصف وإدخال اسم الاختبار", "error");
    return;
  }

  // Get students for selected class
  const classStudents = Object.keys(studentCodes).filter(
    (name) => studentCodes[name].class === selectedClass
  );

  if (classStudents.length === 0) {
    showNotification("لا توجد طلاب في هذا الصف", "error");
    return;
  }

  // Create students test list
  const container = document.getElementById("studentsTestsList");
  container.innerHTML = `
    <div class="bg-blue-50 rounded-xl p-4 mb-6">
      <h5 class="font-bold text-blue-800 mb-2">اختبار: ${testName}</h5>
      <p class="text-blue-700">الصف: ${getClassNameArabic(
        selectedClass
      )} | النوع: ${testType}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  `;

  classStudents.forEach((studentName) => {
    container.innerHTML += `
      <div class="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div class="flex justify-between items-center mb-2">
          <span class="font-medium text-gray-800">${studentName}</span>
          <span class="text-sm text-gray-500">${getClassNameArabic(
            selectedClass
          )}</span>
        </div>
        <div class="flex gap-2">
          <input 
            type="number" 
            id="score-${studentName.replace(/\s+/g, "")}" 
            placeholder="الدرجة" 
            min="0"
            class="score-input tracking-input"
          />
          <input 
            type="number" 
            id="total-${studentName.replace(/\s+/g, "")}" 
            placeholder="من كم" 
            value="20"
            min="1"
            class="score-input tracking-input"
          />
        </div>
      </div>
    `;
  });

  container.innerHTML += `</div>`;
  document.getElementById("quickTestsForm").classList.remove("hidden");
}

function hideQuickTestsEntry() {
  document.getElementById("quickTestsForm").classList.add("hidden");
}

function saveAllTestScores() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const selectedClass = document.getElementById("teacherClassSelect").value;
  const testType = document.getElementById("quickTestType").value;
  const testName = document.getElementById("quickTestName").value.trim();

  const classStudents = Object.keys(studentCodes).filter(
    (name) => studentCodes[name].class === selectedClass
  );

  let savedCount = 0;

  classStudents.forEach((studentName) => {
    const scoreInput = document.getElementById(
      `score-${studentName.replace(/\s+/g, "")}`
    );
    const totalInput = document.getElementById(
      `total-${studentName.replace(/\s+/g, "")}`
    );

    const score = parseInt(scoreInput.value) || 0;
    const total = parseInt(totalInput.value) || 20;

    if (score > 0) {
      // Initialize student tracking if not exists
      if (!studentTracking[studentName]) {
        studentTracking[studentName] = {};
      }

      // Add test score to current week
      const currentWeek = "week1"; // You might want to make this dynamic
      const today = new Date().toLocaleDateString("ar-SA");

      if (!studentTracking[studentName][currentWeek]) {
        studentTracking[studentName][currentWeek] = { days: {} };
      }

      // Add to today or a specific day
      const dayKey = "monday"; // You might want to make this dynamic
      if (!studentTracking[studentName][currentWeek].days[dayKey]) {
        studentTracking[studentName][currentWeek].days[dayKey] = {
          attendance: "present",
          participation: { level: "good", score: 0 },
          homework: { name: "", status: "", score: 0, total: 0 },
          behavior: { level: "good", score: 0 },
          tests: { name: "", type: "", score: 0, total: 0 },
          activities: { name: "", status: "", score: 0 },
          notes: "",
        };
      }

      // Update test data
      studentTracking[studentName][currentWeek].days[dayKey].tests = {
        name: testName,
        type: testType,
        score: score,
        total: total,
      };

      savedCount++;
    }
  });

  if (savedCount > 0) {
    localStorage.setItem("studentTracking", JSON.stringify(studentTracking));
    showNotification(`تم حفظ درجات ${savedCount} طالب بنجاح!`, "success");
    hideQuickTestsEntry();

    // Clear form
    document.getElementById("quickTestName").value = "";
  } else {
    showNotification("لم يتم إدخال أي درجات", "error");
  }
}

function loadStudentsByClass() {
  const selectedClass = document.getElementById("teacherClassSelect").value;
  const studentSelect = document.getElementById("teacherStudentSelect");

  if (!selectedClass) {
    studentSelect.innerHTML = '<option value="">-- اختر طالب --</option>';
    studentSelect.disabled = true;
    return;
  }

  studentSelect.innerHTML = '<option value="">-- اختر طالب --</option>';
  studentSelect.disabled = false;

  // Filter students by class
  Object.keys(studentCodes).forEach((studentName) => {
    if (studentCodes[studentName].class === selectedClass) {
      const option = document.createElement("option");
      option.value = studentName;
      option.textContent = studentName;
      studentSelect.appendChild(option);
    }
  });
}

function checkAdminSections() {
  if (isAdmin) {
    const teacherUploadSection = document.getElementById(
      "teacherUploadSection"
    );
    const teacherWeeklyPlanSection = document.getElementById(
      "teacherWeeklyPlanSection"
    );
    const teacherPhotoSection = document.getElementById("teacherPhotoSection");
    const teacherReviewSection = document.getElementById(
      "teacherReviewSection"
    );
    const designControls = document.getElementById("designControls");
    const classFilterContainer = document.getElementById(
      "classFilterContainer"
    );

    if (teacherUploadSection) teacherUploadSection.classList.remove("hidden");
    if (teacherWeeklyPlanSection)
      teacherWeeklyPlanSection.classList.remove("hidden");
    if (teacherPhotoSection) teacherPhotoSection.classList.remove("hidden");
    if (teacherReviewSection) teacherReviewSection.classList.remove("hidden");
    if (designControls) designControls.classList.remove("hidden");
    if (classFilterContainer) classFilterContainer.classList.remove("hidden");
  }
}

// ENHANCED: تحسين وظيفة تحميل الاختبارات مع فلترة ذكية
function loadExams() {
  const container = document.getElementById("examsList");
  container.innerHTML = "";

  // ENHANCED: تطبيق فلترة ذكية للاختبارات
  let filteredExams = exams.filter((exam) => {
    // For students, only show published exams
    if (!isAdmin && !exam.isPublished) {
      return false;
    }

    // تطبيق فلترة الصف
    if (!isAdmin && currentUser && currentUser.class) {
      // للطلاب - عرض اختبارات فصلهم فقط
      return exam.classes.includes(currentUser.class);
    } else if (isAdmin && currentClass !== "all") {
      // للمعلم - عرض الصف المختار
      return exam.classes.includes(currentClass);
    } else {
      // للمعلم مع "جميع الصفوف" أو للضيوف
      return true;
    }
  });

  if (filteredExams.length === 0) {
    const noExamsMessage =
      !isAdmin && currentUser
        ? `لا توجد اختبارات متاحة لصف ${getClassNameArabic(currentUser.class)}`
        : "لا توجد اختبارات متاحة";

    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">${noExamsMessage}</h3>
        <p class="text-gray-500 text-lg">سيتم إضافة الاختبارات من قبل المعلم</p>
      </div>
    `;
    return;
  }

  filteredExams.forEach((exam) => {
    // Show schedule info if exam is scheduled
    let scheduleBadge = "";
    if (exam.publishDate && exam.publishTime && !exam.isPublished) {
      const publishDateTime = new Date(
        `${exam.publishDate}T${exam.publishTime}`
      );
      const now = new Date();

      if (publishDateTime > now) {
        scheduleBadge = `
          <div class="scheduled-exam-badge">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            مجدول
          </div>
        `;
      }
    }

    // Show draft badge if exam is draft
    if (exam.status === "draft") {
      scheduleBadge = `
        <div class="scheduled-exam-badge draft-badge">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          مسودة
        </div>
      `;
    }

    // ENHANCED: إظهار الصفوف المستهدفة للاختبار (للطلاب يظهر فصلهم فقط)
    let targetClassesText = "";
    if (isAdmin) {
      targetClassesText = exam.classes
        .map((cls) => getClassNameArabic(cls))
        .join("، ");
    } else if (currentUser && currentUser.class) {
      // للطالب - إظهار فصله فقط حتى لو كان الاختبار يستهدف صفوف أخرى
      targetClassesText = getClassNameArabic(currentUser.class);
    }

    const examHtml = `
            <div class="exam-card p-8 relative overflow-hidden">
                ${scheduleBadge}
                <div class="flex justify-between items-start mb-6 relative z-10">
                    <h3 class="text-2xl font-bold gradient-text flex-1">${
                      exam.title
                    }</h3>
                </div>
                <p class="text-gray-600 mb-6 text-lg leading-relaxed">${
                  exam.description
                }</p>
                <div class="flex justify-between items-center mb-6 bg-gray-50 rounded-xl p-4">
                    <div class="flex items-center text-blue-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-lg">⏰ ${exam.duration} دقائق</span>
                    </div>
                    <div class="flex items-center text-green-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-lg">📝 ${
                          exam.questions.length
                        } أسئلة</span>
                    </div>
                </div>
                
                ${
                  targetClassesText
                    ? `
                  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span class="font-medium">${
                        isAdmin ? "الصفوف المستهدفة:" : "صفك:"
                      } ${targetClassesText}</span>
                    </div>
                  </div>
                `
                    : ""
                }
                
                ${
                  exam.publishDate && exam.publishTime && !exam.isPublished
                    ? `
                  <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center text-orange-800">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="font-medium">سيتم نشر الاختبار في: ${exam.publishDate} الساعة ${exam.publishTime}</span>
                    </div>
                  </div>
                `
                    : ""
                }
                
                <div class="flex gap-3">
                  ${
                    exam.isPublished && exam.status === "published"
                      ? `
                    <button onclick="startExam('${exam.id}')" class="flex-1 success-gradient hover:shadow-2xl text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 interactive-button text-lg">
                       🚀 ابدأ الاختبار الآن!
                    </button>
                  `
                      : `
                    <button disabled class="flex-1 bg-gray-300 text-gray-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
                       ${
                         exam.status === "draft"
                           ? "📝 مسودة"
                           : "⏰ الاختبار غير متاح بعد"
                       }
                    </button>
                  `
                  }
                  ${
                    isAdmin
                      ? `
                  <button onclick="editExam('${exam.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105" title="تعديل الاختبار">
                    ✏️
                  </button>
                  `
                      : ""
                  }
                </div>
            </div>
        `;
    container.innerHTML += examHtml;
  });
}

// Enhanced Load exam history
function loadExamHistory() {
  const container = document.getElementById("examHistory");

  if (!currentUser || examHistory.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <span class="text-4xl">📊</span>
        </div>
        <p class="text-gray-500 text-xl">لم تقم بإجراء أي اختبار بعد. ابدأ رحلتك التعليمية الآن!</p>
      </div>
    `;
    return;
  }

  // Filter history for current user
  const userHistory = examHistory.filter(
    (record) => record.username === currentUser.name
  );

  if (userHistory.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <span class="text-4xl">📊</span>
        </div>
        <p class="text-gray-500 text-xl">لم تقم بإجراء أي اختبار بعد. ابدأ رحلتك التعليمية الآن!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  userHistory
    .slice(-5)
    .reverse()
    .forEach((record) => {
      const gradeColor =
        record.percentage >= 90
          ? "text-green-600"
          : record.percentage >= 80
          ? "text-blue-600"
          : record.percentage >= 60
          ? "text-yellow-600"
          : "text-red-600";

      const gradeBg =
        record.percentage >= 90
          ? "bg-green-50 border-green-200"
          : record.percentage >= 80
          ? "bg-blue-50 border-blue-200"
          : record.percentage >= 60
          ? "bg-yellow-50 border-yellow-200"
          : "bg-red-50 border-red-200";

      const gradeEmoji =
        record.percentage >= 90
          ? "🏆"
          : record.percentage >= 80
          ? "⭐"
          : record.percentage >= 60
          ? "👍"
          : "💪";

      const historyHtml = `
      <div class="bg-white border-2 ${gradeBg} rounded-xl p-6 flex justify-between items-center card-hover">
        <div class="flex items-center">
          <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center ml-4">
            <span class="text-2xl">${gradeEmoji}</span>
          </div>
          <div>
            <h4 class="font-bold text-gray-800 text-lg">${record.examTitle}</h4>
            <p class="text-gray-600 flex items-center mt-1">
              📅 ${record.date}
            </p>
          </div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold ${gradeColor}">${record.percentage}%</div>
          <div class="text-gray-500 mt-1">${record.score}/${record.totalQuestions} ✅</div>
        </div>
      </div>
    `;
      container.innerHTML += historyHtml;
    });
}

// Start exam
function startExam(examId) {
  if (!currentUser) {
    showNotification("يرجى تسجيل الدخول أولاً للبدء في الاختبار", "error");
    showLoginModal();
    return;
  }

  currentExam = exams.find((exam) => exam.id === examId);
  if (!currentExam) return;

  // Check if exam is published
  if (!currentExam.isPublished || currentExam.status !== "published") {
    showNotification("هذا الاختبار غير متاح حالياً", "error");
    return;
  }

  // ENHANCED: للطلاب - التحقق من أن الاختبار يستهدف فصلهم
  if (!isAdmin && currentUser && currentUser.class) {
    if (!currentExam.classes.includes(currentUser.class)) {
      showNotification(
        `هذا الاختبار غير متاح لصف ${getClassNameArabic(currentUser.class)}`,
        "error"
      );
      return;
    }
  }

  // Reset exam state
  currentQuestionIndex = 0;
  userAnswers = {};
  examTimeLeft = currentExam.duration * 60; // Convert to seconds

  // Show exam section
  showSection("examTaking");

  // Load exam UI
  loadExamInterface();

  // Start timer
  startExamTimer();

  // Show motivation message
  showNotification("بدأ الاختبار! بالتوفيق والنجاح", "info");
}

function loadExamInterface() {
  const examTakingSection = document.getElementById("examTaking");

  const examHtml = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500"></div>
            <div class="flex justify-between items-center mb-8">
                <h2 id="examTitle" class="text-3xl font-bold gradient-text">${
                  currentExam.title
                }</h2>
                <div class="flex items-center">
                    <div id="examTimer" class="bg-blue-100 text-blue-800 px-6 py-3 rounded-xl font-bold timer-animation flex items-center text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                        </svg>
                        ⏰ <span id="timerDisplay">${formatTime(
                          examTimeLeft
                        )}</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <div class="text-gray-700 text-lg font-medium">
                        📝 السؤال <span id="currentQuestionNum" class="text-blue-600 font-bold">${
                          currentQuestionIndex + 1
                        }</span> من <span id="totalQuestions" class="text-green-600 font-bold">${
    currentExam.questions.length
  }</span>
                    </div>
                    <div class="bg-gray-200 h-3 rounded-full w-full max-w-xs mx-4">
                        <div id="progressBar" class="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" style="width: ${
                          ((currentQuestionIndex + 1) /
                            currentExam.questions.length) *
                          100
                        }%;"></div>
                    </div>
                </div>
            </div>
            
            <div id="questionContainer" class="mb-10">
                ${loadCurrentQuestion()}
            </div>
            
            <div class="flex justify-between">
                <button id="prevQuestionBtn" onclick="prevQuestion()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center text-lg ${
                  currentQuestionIndex === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }" ${currentQuestionIndex === 0 ? "disabled" : ""}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    ⬅️ السابق
                </button>
                <button id="nextQuestionBtn" onclick="nextQuestion()" class="success-gradient hover:shadow-2xl text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center text-lg interactive-button">
                    ${
                      currentQuestionIndex === currentExam.questions.length - 1
                        ? "🏁 إنهاء الاختبار"
                        : "➡️ التالي"
                    }
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    `;

  examTakingSection.innerHTML = examHtml;
}

function loadCurrentQuestion() {
  const question = currentExam.questions[currentQuestionIndex];

  let questionImageHtml = "";
  if (question.image) {
    questionImageHtml = `
      <div class="mb-6 text-center">
        <img src="${question.image}" alt="صورة السؤال" class="image-preview mx-auto" onclick="showImageModal('${question.image}')" />
        <p class="text-sm text-gray-500 mt-2">اضغط على الصورة لتكبيرها</p>
      </div>
    `;
  }

  let optionsHtml = "";

  if (question.type === "mcq") {
    question.options.forEach((option, index) => {
      const isChecked = userAnswers[question.id] === index ? "checked" : "";
      const selectedClass = isChecked
        ? "border-blue-500 bg-blue-50 shadow-md"
        : "";

      optionsHtml += `
              <label class="block bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 card-hover ${selectedClass}">
                  <div class="flex items-center">
                      <input type="radio" name="q${question.id}" value="${index}" ${isChecked} onchange="saveAnswer(${question.id}, ${index})" class="ml-4 w-5 h-5 text-blue-600">
                      <span class="text-xl font-medium">${option}</span>
                  </div>
              </label>
          `;
    });
  } else if (question.type === "essay") {
    optionsHtml = `
      <div class="essay-question-container">
        <textarea 
          id="essay-answer-${question.id}"
          placeholder="اكتب إجابتك هنا..."
          rows="6"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
          onchange="saveEssayAnswer(${question.id}, this.value)"
        >${userAnswers[question.id] || ""}</textarea>
        <div class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-800 text-sm">
            💡 <strong>نصيحة:</strong> اكتب إجابة مفصلة وواضحة. استخدم الأمثلة والخطوات إذا أمكن.
          </p>
        </div>
      </div>
    `;
  }

  return `
        <div class="question active">
            <h3 class="text-3xl font-bold text-gray-800 mb-8 leading-relaxed bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                ${question.text}
            </h3>
            ${questionImageHtml}
            <div class="space-y-4">
                ${optionsHtml}
            </div>
        </div>
    `;
}

function saveAnswer(questionId, answerIndex) {
  userAnswers[questionId] = answerIndex;
  showNotification("تم حفظ الإجابة", "info");
}

function saveEssayAnswer(questionId, answerText) {
  userAnswers[questionId] = answerText.trim();
  showNotification("تم حفظ الإجابة", "info");
}

function nextQuestion() {
  if (currentQuestionIndex < currentExam.questions.length - 1) {
    currentQuestionIndex++;
    loadExamInterface();
  } else {
    finishExam();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadExamInterface();
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function finishExam() {
  if (examTimer) {
    clearInterval(examTimer);
  }

  // Calculate results
  const results = calculateExamResults();

  // Save to history with username
  examHistory.push({
    examId: currentExam.id,
    examTitle: currentExam.title,
    username: currentUser.name,
    score: results.score,
    totalQuestions: results.totalQuestions,
    percentage: results.percentage,
    date: new Date().toLocaleDateString("ar-SA"),
    timeSpent: currentExam.duration * 60 - examTimeLeft,
  });

  localStorage.setItem("examHistory", JSON.stringify(examHistory));

  // Save wrong answers to student's error file
  if (currentUser && currentUser.role === "student") {
    saveWrongAnswers(results.wrongAnswers);
  }

  // Show results
  showExamResults(results);
}

function calculateExamResults() {
  let correctAnswers = 0;
  const totalQuestions = currentExam.questions.length;
  const reviewData = [];
  const wrongAnswers = [];

  currentExam.questions.forEach((question) => {
    const userAnswer = userAnswers[question.id];
    let isCorrect = false;

    if (question.type === "mcq") {
      isCorrect = userAnswer === question.correctAnswer;
    } else if (question.type === "essay") {
      // For essay questions, we'll mark them as correct for now
      // In a real system, these would need manual grading
      isCorrect = userAnswer && userAnswer.length > 10; // Basic check for substantial answer
    }

    if (isCorrect) {
      correctAnswers++;
    } else if (question.type === "mcq") {
      // Only add MCQ wrong answers to error file
      wrongAnswers.push({
        examTitle: currentExam.title,
        question: question.text,
        userAnswer:
          userAnswer !== undefined
            ? question.options[userAnswer]
            : "لم يتم الإجابة",
        correctAnswer: question.options[question.correctAnswer],
        date: new Date().toLocaleDateString("ar-SA"),
        questionId: question.id,
        examId: currentExam.id,
      });
    }

    reviewData.push({
      question: question.text,
      userAnswer:
        question.type === "mcq"
          ? userAnswer !== undefined
            ? question.options[userAnswer]
            : "لم يتم الإجابة"
          : userAnswer || "لم يتم الإجابة",
      correctAnswer:
        question.type === "mcq"
          ? question.options[question.correctAnswer]
          : "يحتاج مراجعة المعلم",
      isCorrect: isCorrect,
      type: question.type,
    });
  });

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  return {
    score: correctAnswers,
    totalQuestions: totalQuestions,
    percentage: percentage,
    timeSpent: currentExam.duration * 60 - examTimeLeft,
    reviewData: reviewData,
    wrongAnswers: wrongAnswers,
  };
}

function saveWrongAnswers(wrongAnswers) {
  if (!currentUser || wrongAnswers.length === 0) return;

  const username = currentUser.name;
  if (!studentErrors[username]) {
    studentErrors[username] = [];
  }

  // Add wrong answers to student's error file
  studentErrors[username] = studentErrors[username].concat(wrongAnswers);

  // Save to localStorage
  localStorage.setItem("studentErrors", JSON.stringify(studentErrors));
}

function getPerformanceMessage(percentage) {
  if (percentage >= 90) {
    return {
      title: "ممتاز جداً! نجم الرياضيات!",
      message:
        "أداء استثنائي ورائع! أنت من المتميزين حقاً. استمر في هذا المستوى الرائع وكن مصدر إلهام للآخرين!",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  } else if (percentage >= 80) {
    return {
      title: "ممتاز! أداء مميز!",
      message:
        "أداء رائع ومتميز! أنت على الطريق الصحيح نحو التفوق. استمر في التقدم وتحدى نفسك أكثر!",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    };
  } else if (percentage >= 70) {
    return {
      title: "جيد جداً! تقدم ملحوظ!",
      message:
        "أداء جيد ومشجع! يمكنك تحسين مستواك أكثر بالمراجعة والتدريب المستمر. أنت قادر على الأفضل!",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  } else if (percentage >= 60) {
    return {
      title: "جيد! بداية موفقة!",
      message:
        "أداء مقبول وبداية جيدة، لكن هناك مجال للتحسن. تحتاج إلى مزيد من التدريب والمراجعة لتحقيق أهدافك. لا تستسلم!",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    };
  } else {
    return {
      title: "تحتاج إلى مراجعة! لا تيأس!",
      message:
        "لا تقلق أبداً! كل عالم رياضيات بدأ من الصفر. النجاح يحتاج إلى صبر ومثابرة وتدريب مستمر. راجع المادة وأعد المحاولة بثقة!",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  }
}

function showExamResults(results) {
  const resultsSection = document.getElementById("examResults");
  const performance = getPerformanceMessage(results.percentage);

  // New: Print all questions button
  const printAllQuestionsBtn = `
    <button onclick="printAllQuestions()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center">
      🖨️ طباعة جميع الأسئلة والأجوبة
    </button>
  `;

  const printWrongAnswersBtn =
    results.wrongAnswers.length > 0
      ? `
    <button onclick="printWrongAnswers()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center">
      🖨️ طباعة الأخطاء فقط
    </button>
  `
      : "";

  const saveErrorsBtn =
    results.wrongAnswers.length > 0 &&
    currentUser &&
    currentUser.role === "student"
      ? `
    <button onclick="showNotification('تم حفظ الأخطاء في ملفك الشخصي')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center">
      💾 محفوظ في ملف الأخطاء
    </button>
  `
      : "";

  const resultsHtml = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-blue-500"></div>
            <div class="text-center mb-10">
                <div class="inline-block ${
                  performance.bgColor
                } rounded-full p-8 mb-6 ${
    performance.borderColor
  } border-2 relative">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-20 animate-pulse"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 ${
                      performance.color
                    } relative z-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <h2 class="text-4xl font-bold ${performance.color} mb-4">${
    performance.title
  }</h2>
                <div class="max-w-2xl mx-auto ${performance.bgColor} ${
    performance.borderColor
  } border-2 rounded-xl p-6 mb-8">
                    <p class="${
                      performance.color
                    } text-xl font-medium leading-relaxed">${
    performance.message
  }</p>
                </div>
                <div class="flex justify-center items-center space-x-6 space-x-reverse mb-8">
                    <div class="bg-blue-50 rounded-xl p-6 text-center min-w-[140px] border-2 border-blue-200 card-hover">
                        <div class="text-4xl font-bold text-blue-800">${
                          results.percentage
                        }%</div>
                        <div class="text-gray-600 mt-2">📊 النسبة</div>
                    </div>
                    <div class="bg-blue-50 rounded-xl p-6 text-center min-w-[140px] border-2 border-blue-200 card-hover">
                        <div class="text-4xl font-bold text-blue-800">${
                          results.score
                        }/${results.totalQuestions}</div>
                        <div class="text-gray-600 mt-2">✅ الدرجة</div>
                    </div>
                    <div class="bg-blue-50 rounded-xl p-6 text-center min-w-[140px] border-2 border-blue-200 card-hover">
                        <div class="text-4xl font-bold text-blue-800">${formatTime(
                          results.timeSpent
                        )}</div>
                        <div class="text-gray-600 mt-2">⏰ الوقت</div>
                    </div>
                </div>
            </div>
            
            <div class="mb-10">
                <h3 class="text-2xl font-bold gradient-text mb-6 flex items-center">
                    📝 مراجعة شاملة للإجابات
                </h3>
                <div class="space-y-6">
                    ${results.reviewData
                      .map(
                        (item, index) => `
                        <div class="bg-${
                          item.isCorrect ? "green" : "red"
                        }-50 border-2 border-${
                          item.isCorrect ? "green" : "red"
                        }-200 rounded-xl p-6 card-hover">
                            <div class="flex justify-between items-start mb-4">
                                <h4 class="font-bold text-gray-800 text-xl flex-1">${
                                  index + 1
                                }. ${item.question}</h4>
                                <span class="bg-${
                                  item.isCorrect ? "green" : "red"
                                }-100 text-${
                          item.isCorrect ? "green" : "red"
                        }-800 font-bold px-4 py-2 rounded-full flex items-center">
                                    ${item.isCorrect ? "✅ صحيحة" : "❌ خاطئة"}
                                </span>
                            </div>
                            <div class="mb-4 bg-white rounded-lg p-4">
                                <p class="text-gray-700 text-lg"><strong>إجابتك:</strong> <span class="font-medium">${
                                  item.userAnswer
                                }</span></p>
                            </div>
                            <div class="bg-${
                              item.isCorrect ? "green" : "red"
                            }-100 p-4 rounded-lg">
                                <p class="text-${
                                  item.isCorrect ? "green" : "red"
                                }-800 font-bold text-lg flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </svg>
                                    ${
                                      item.type === "mcq"
                                        ? "الإجابة الصحيحة: " +
                                          item.correctAnswer
                                        : item.correctAnswer
                                    }
                                </p>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="flex flex-wrap gap-4 justify-center">
                <button onclick="retakeExam()" class="success-gradient hover:shadow-2xl text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center interactive-button text-lg">
                    🔄 إعادة الاختبار
                </button>
                ${printAllQuestionsBtn}
                ${printWrongAnswersBtn}
                ${saveErrorsBtn}
                <button onclick="showSection('exams')" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center text-lg">
                    ↩️ العودة إلى الاختبارات
                </button>
            </div>
        </div>
    `;

  resultsSection.innerHTML = resultsHtml;
  showSection("examResults");

  // Update exam history display
  loadExamHistory();
}

// New function: Print all questions with correct answers
function printAllQuestions() {
  if (!currentExam) return;

  const results = calculateExamResults();

  //  print content
  let printContent = `
    <html dir="rtl">
    <head>
      <title>جميع أسئلة الاختبار - ${currentExam.title}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; margin: 20px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 25px; margin-bottom: 35px; }
        .exam-title { color: #1E40AF; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
        .student-info { color: #6B7280; margin-bottom: 12px; font-size: 16px; }
        .question { margin-bottom: 30px; padding: 20px; border: 2px solid #E5E7EB; border-radius: 12px; background: #F9FAFB; }
        .question-header { font-weight: bold; color: #1F2937; margin-bottom: 15px; font-size: 18px; }
        .options { margin: 15px 0; padding-left: 20px; }
        .option { margin: 8px 0; padding: 8px; background: white; border-radius: 6px; }
        .correct-answer { background: #D1FAE5; color: #065F46; font-weight: bold; border: 2px solid #10B981; }
        .student-answer { background: #FEE2E2; color: #991B1B; font-weight: bold; border: 2px solid #EF4444; }
        .student-answer.correct { background: #D1FAE5; color: #065F46; border: 2px solid #10B981; }
        .answer-section { margin: 15px 0; }
        .footer { margin-top: 40px; text-align: center; color: #6B7280; border-top: 2px solid #E5E7EB; padding-top: 25px; }
        .stats { background: #F3F4F6; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="exam-title">${currentExam.title}</div>
        <div class="student-info">الطالب: ${
          currentUser ? currentUser.name : "غير محدد"
        }</div>
        <div class="student-info">تاريخ الاختبار: ${new Date().toLocaleDateString(
          "ar-SA"
        )}</div>
        <div class="student-info">مدة الاختبار: ${
          currentExam.duration
        } دقيقة</div>
      </div>
      
      <div class="stats">
        <h3>📊 نتائج الاختبار</h3>
        <p><strong>النتيجة:</strong> ${results.score} من ${
    results.totalQuestions
  } (${results.percentage}%)</p>
        <p><strong>الإجابات الصحيحة:</strong> ${results.score} ✅</p>
        <p><strong>الإجابات الخاطئة:</strong> ${
          results.totalQuestions - results.score
        } ❌</p>
      </div>
      
      <h2 style="color: #3B82F6; text-align: center; margin-bottom: 30px;">📝 جميع أسئلة الاختبار مع الإجابات</h2>
  `;

  currentExam.questions.forEach((question, index) => {
    const userAnswer = userAnswers[question.id];
    let isCorrect = false;

    if (question.type === "mcq") {
      isCorrect = userAnswer === question.correctAnswer;
    } else if (question.type === "essay") {
      isCorrect = userAnswer && userAnswer.length > 10;
    }

    printContent += `
      <div class="question">
        <div class="question-header">السؤال ${index + 1}: ${question.text}</div>
        ${question.type === "mcq" ? `<div class="options">` : ""}
    `;

    if (question.type === "mcq") {
      question.options.forEach((option, optionIndex) => {
        let optionClass = "option";
        let prefix = "";

        if (optionIndex === question.correctAnswer) {
          optionClass += " correct-answer";
          prefix = "✅ (الإجابة الصحيحة) ";
        }

        if (userAnswer === optionIndex) {
          if (isCorrect) {
            optionClass += " student-answer correct";
            prefix = "✅ (إجابتك - صحيحة) ";
          } else {
            optionClass += " student-answer";
            prefix = "❌ (إجابتك - خاطئة) ";
          }
        }

        printContent += `<div class="${optionClass}">${prefix}${option}</div>`;
      });

      printContent += `</div>`;
    } else if (question.type === "essay") {
      printContent += `
        <div class="answer-section">
          <p><strong>إجابتك:</strong></p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #e5e7eb;">
            ${userAnswer || "لم يتم الإجابة"}
          </div>
        </div>
      `;
    }

    printContent += `
        <div class="answer-section">
          <p><strong>حالة الإجابة:</strong> ${
            isCorrect ? "✅ صحيحة" : "❌ خاطئة"
          }</p>
        </div>
      </div>
    `;
  });

  printContent += `
      <div class="footer">
        <p><strong>ملاحظات للطالب:</strong></p>
        <p>• راجع الإجابات الخاطئة واعرف السبب</p>
        <p>• تدرب على الأسئلة المشابهة</p>
        <p>• لا تتردد في طرح الأسئلة على المعلم</p>
        <p>• الأخطاء فرصة للتعلم والتحسن</p>
        <p style="margin-top: 30px; font-weight: bold;">موقع الأستاذ علي العيسني للرياضيات</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();

  showNotification("تم إعداد جميع الأسئلة للطباعة");
}

function printWrongAnswers() {
  if (!currentExam) return;

  const results = calculateExamResults();
  if (results.wrongAnswers.length === 0) {
    showNotification("لا توجد أخطاء للطباعة - أداء ممتاز!", "success");
    return;
  }

  // Create print content
  let printContent = `
    <html dir="rtl">
    <head>
      <title>الأسئلة الخاطئة - ${currentExam.title}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; margin: 20px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 3px solid #EF4444; padding-bottom: 25px; margin-bottom: 35px; }
        .exam-title { color: #DC2626; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
        .student-info { color: #6B7280; margin-bottom: 12px; font-size: 16px; }
        .question { margin-bottom: 30px; padding: 20px; border: 2px solid #FEE2E2; border-radius: 12px; background: #FEF2F2; }
        .question-header { font-weight: bold; color: #1F2937; margin-bottom: 15px; font-size: 18px; }
        .answer-section { margin: 15px 0; }
        .wrong-answer { color: #DC2626; font-weight: bold; background: #FEE2E2; padding: 12px; border-radius: 8px; margin: 8px 0; }
        .correct-answer { color: #059669; font-weight: bold; background: #D1FAE5; padding: 12px; border-radius: 8px; margin: 8px 0; }
        .footer { margin-top: 40px; text-align: center; color: #6B7280; border-top: 2px solid #E5E7EB; padding-top: 25px; }
        .tips { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="exam-title">${currentExam.title}</div>
        <div class="student-info">الطالب: ${
          currentUser ? currentUser.name : "غير محدد"
        }</div>
        <div class="student-info">تاريخ الاختبار: ${new Date().toLocaleDateString(
          "ar-SA"
        )}</div>
        <div class="student-info">عدد الأخطاء: ${
          results.wrongAnswers.length
        } من ${currentExam.questions.length}</div>
      </div>
      
      <h2 style="color: #DC2626; text-align: center; margin-bottom: 30px;">🔍 الأسئلة التي تحتاج مراجعة</h2>
      
      <div class="tips">
        <h3 style="color: #92400E; margin-bottom: 15px;">💡 نصائح مهمة:</h3>
        <p style="color: #92400E;">• لا تيأس من الأخطاء، فهي جزء طبيعي من التعلم</p>
        <p style="color: #92400E;">• راجع كل سؤال خاطئ واعرف السبب</p>
        <p style="color: #92400E;">• تدرب على أسئلة مشابهة</p>
        <p style="color: #92400E;">• اطلب المساعدة من المعلم إذا لم تفهم شيئاً</p>
      </div>
  `;

  results.wrongAnswers.forEach((error, index) => {
    printContent += `
      <div class="question">
        <div class="question-header">السؤال ${index + 1}: ${
      error.question
    }</div>
        <div class="answer-section">
          <div class="wrong-answer">❌ إجابتك: ${error.userAnswer}</div>
          <div class="correct-answer">✅ الإجابة الصحيحة: ${
            error.correctAnswer
          }</div>
        </div>
      </div>
    `;
  });

  printContent += `
      <div class="footer">
        <p><strong>رسالة تحفيزية:</strong></p>
        <p style="font-size: 18px; color: #059669; font-weight: bold;">كل خطأ هو خطوة نحو التعلم والتطور</p>
        <p>راجع هذه الأسئلة، تعلم منها، وستكون أقوى في المرة القادمة!</p>
        <p style="margin-top: 30px; font-weight: bold;">موقع الأستاذ علي العيسني للرياضيات</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();

  showNotification("تم إعداد الأسئلة الخاطئة للطباعة");
}

function retakeExam() {
  if (currentExam) {
    startExam(currentExam.id);
  }
}

// Enhanced Load saved errors for student
function loadSavedErrors() {
  const container = document.getElementById("savedErrorsContainer");

  if (!currentUser || currentUser.role !== "student") {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">تسجيل الدخول مطلوب</h3>
        <p class="text-gray-500 text-lg">يرجى تسجيل الدخول كطالب لعرض ملف الأخطاء الشخصي</p>
      </div>
    `;
    return;
  }

  const username = currentUser.name;
  const userErrors = studentErrors[username] || [];

  if (userErrors.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="text-3xl font-bold text-green-600 mb-4">ممتاز! أداء رائع!</h3>
        <p class="text-gray-600 text-xl mb-2">لا توجد أخطاء محفوظة في ملفك.</p>
        <p class="text-gray-500 mb-6">عندما تجري اختبارات وتخطئ في بعض الأسئلة، ستظهر هنا لمراجعتها والتعلم منها.</p>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
          <p class="text-blue-800 font-medium">💡 نصيحة: الأخطاء فرصة ذهبية للتعلم والتطور!</p>
        </div>
      </div>
    `;
    return;
  }

  // Group errors by exam
  const errorsByExam = {};
  userErrors.forEach((error) => {
    if (!errorsByExam[error.examTitle]) {
      errorsByExam[error.examTitle] = [];
    }
    errorsByExam[error.examTitle].push(error);
  });

  let errorsHtml = `
    <div class="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
      <div class="flex items-center mb-6">
        <div class="bg-blue-100 rounded-full p-3 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold gradient-text">📊 إحصائيات التعلم</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div class="bg-white rounded-xl p-6 card-hover">
          <div class="text-4xl font-bold text-red-600">${
            userErrors.length
          }</div>
          <div class="text-gray-600 mt-2">إجمالي الأخطاء</div>
        </div>
        <div class="bg-white rounded-xl p-6 card-hover">
          <div class="text-4xl font-bold text-blue-600">${
            Object.keys(errorsByExam).length
          }</div>
          <div class="text-gray-600 mt-2">الاختبارات</div>
        </div>
        <div class="bg-white rounded-xl p-6 card-hover">
          <div class="text-4xl font-bold text-green-600">${Math.round(
            (Object.keys(errorsByExam).length / Math.max(exams.length, 1)) * 100
          )}%</div>
          <div class="text-gray-600 mt-2">التقدم</div>
        </div>
      </div>
    </div>
  `;

  Object.keys(errorsByExam).forEach((examTitle) => {
    const examErrors = errorsByExam[examTitle];
    errorsHtml += `
      <div class="bg-white border border-gray-200 rounded-2xl p-8 mb-8 card-hover">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-red-600 flex items-center">
            📝 ${examTitle}
          </h3>
          <span class="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-full">
            ${examErrors.length} خطأ
          </span>
        </div>
        
        <div class="space-y-6">
          ${examErrors
            .map(
              (error, index) => `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6">
              <h4 class="font-bold text-gray-800 mb-4 text-xl">${index + 1}. ${
                error.question
              }</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <div class="text-sm text-gray-600 mb-2">إجابتك:</div>
                  <div class="font-bold text-red-600 text-lg">❌ ${
                    error.userAnswer
                  }</div>
                </div>
                <div class="bg-white rounded-lg p-4 border border-green-200">
                  <div class="text-sm text-gray-600 mb-2">الإجابة الصحيحة:</div>
                  <div class="font-bold text-green-600 text-lg">✅ ${
                    error.correctAnswer
                  }</div>
                </div>
              </div>
              <div class="flex justify-between items-center text-sm text-gray-500">
                <span>📅 تاريخ الاختبار: ${error.date}</span>
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">💡 فرصة للتعلم</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  });

  // Add motivational message and clear button
  errorsHtml += `
    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 mb-8">
      <div class="text-center">
        <div class="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">💡</span>
        </div>
        <h3 class="text-2xl font-bold text-yellow-800 mb-4">رسالة تحفيزية</h3>
        <p class="text-yellow-700 text-lg leading-relaxed mb-4">
          كل خطأ هو خطوة نحو النجاح! راجع هذه الأسئلة، تعلم منها، واستخدمها لتصبح أقوى في الرياضيات.
          الأخطاء ليست فشلاً، بل هي جسر يوصلك إلى التفوق والتميز.
        </p>
      </div>
    </div>
    
    <div class="text-center">
      <button onclick="clearStudentErrors()" class="error-gradient hover:shadow-2xl text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
        🗑️ مسح جميع الأخطاء
      </button>
    </div>
  `;

  container.innerHTML = errorsHtml;
}

function clearStudentErrors() {
  if (!currentUser || currentUser.role !== "student") return;

  if (
    confirm(
      "هل أنت متأكد من مسح جميع الأخطاء المحفوظة؟ هذا الإجراء لا يمكن التراجع عنه."
    )
  ) {
    const username = currentUser.name;
    studentErrors[username] = [];
    localStorage.setItem("studentErrors", JSON.stringify(studentErrors));
    loadSavedErrors();
    showNotification("تم مسح جميع الأخطاء بنجاح!");
  }
}

// ENHANCED: تحسين وظيفة تحميل الطلاب مع فلترة ذكية
function loadStudents() {
  showWeekStudents("week1");
}

function showWeekStudents(weekName) {
  const container = document.getElementById("studentsContainer");

  // Update tab states
  const tabs = document.querySelectorAll(".week-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("border-blue-600", "active");
    tab.classList.add("border-transparent");
  });

  const activeTab = document.querySelector(
    `[onclick="showWeekStudents('${weekName}')"]`
  );
  if (activeTab) {
    activeTab.classList.add("border-blue-600", "active");
    activeTab.classList.remove("border-transparent");
  }

  let weekStudents = students[weekName] || [];

  // ENHANCED: تطبيق فلترة ذكية للطلاب المتميزين
  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض طلاب فصلهم فقط
    weekStudents = weekStudents.filter(
      (student) => student.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    // للمعلم - عرض الصف المختار
    weekStudents = weekStudents.filter(
      (student) => student.class === currentClass
    );
  }

  let studentsHtml =
    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">';

  if (weekStudents.length === 0) {
    const weekNameArabic = getWeekNameArabic(weekName);
    const noStudentsMessage =
      !isAdmin && currentUser
        ? `لم يتم إضافة طلاب متميزين من صف ${getClassNameArabic(
            currentUser.class
          )} لـ${weekNameArabic} بعد`
        : `لم يتم إضافة طلاب متميزين لـ${weekNameArabic} بعد`;

    studentsHtml += `
      <div class="col-span-full text-center py-12">
        <div class="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <span class="text-4xl">🌟</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">${noStudentsMessage}</h3>
        <p class="text-gray-500 text-lg">كن أول المتميزين${
          !isAdmin && currentUser ? " في صفك" : ""
        } في هذا الأسبوع!</p>
      </div>
    `;
  } else {
    weekStudents.forEach((student) => {
      const classNameArabic = getClassNameArabic(student.class);
      studentsHtml += `
                <div class="student-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-yellow-400 text-yellow-800 px-4 py-2 rounded-bl-xl font-bold animate-bounce-gentle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        ⭐ متميز
                    </div>
                    <div class="flex flex-col items-center text-center mt-6">
                        <div class="w-28 h-28 bg-blue-200 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold gradient-text mb-2">${
                          student.name
                        }</h3>
                        <p class="text-sm text-blue-600 font-medium mb-4">${classNameArabic}
                        <p class="text-gray-600 text-lg italic leading-relaxed mb-6">"${
                          student.quote
                        }"</p>
                        <div class="flex justify-center flex-wrap gap-2">
                            ${student.tags
                              .map(
                                (tag) =>
                                  `<span class="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">${tag}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
    });
  }

  studentsHtml += "</div>";
  container.innerHTML = studentsHtml;
}

// ENHANCED: تحسين وظيفة تحميل التذكيرات مع فلترة ذكية
function loadReminders() {
  const container = document.getElementById("remindersList");
  container.innerHTML = "";

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 21l-.707-.707L18.828 5l.707.707L4.828 21zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">لا توجد تذكيرات بعد</h3>
        <p class="text-gray-500 text-lg">سيتم إضافة التذكيرات من قبل المعلم</p>
      </div>
    `;
    return;
  }

  // ENHANCED: فلترة التذكيرات للطلاب حسب فصلهم
  let filteredReminders = reminders;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض التذكيرات المخصصة لفصلهم أو التذكيرات العامة
    filteredReminders = reminders.filter(
      (reminder) =>
        reminder.classes.includes(currentUser.class) ||
        reminder.classes.includes("all")
    );
  }

  if (filteredReminders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 21l-.707-.707L18.828 5l.707.707L4.828 21zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          ${
            !isAdmin && currentUser
              ? `لا توجد تذكيرات لصف ${getClassNameArabic(
                  currentUser.class
                )} حالياً`
              : "لا توجد تذكيرات بعد"
          }
        </h3>
        <p class="text-gray-500 text-lg">سيتم إضافة التذكيرات من قبل المعلم</p>
      </div>
    `;
    return;
  }

  filteredReminders.forEach((reminder) => {
    const typeColors = {
      new: "from-blue-500 to-blue-600",
      important: "from-green-500 to-green-600",
      urgent: "from-red-500 to-red-600",
    };

    const typeIcons = {
      new: "🔔",
      important: "⚠️",
      urgent: "🚨",
    };

    const typeBadges = {
      new: "bg-blue-100 text-blue-800",
      important: "bg-green-100 text-green-800",
      urgent: "bg-red-100 text-red-800",
    };

    const typeLabels = {
      new: "جديد",
      important: "مهم",
      urgent: "عاجل",
    };

    // ENHANCED: عرض الصفوف المستهدفة بناءً على نوع المستخدم
    let targetClassesText = "";
    if (isAdmin) {
      targetClassesText = reminder.classes
        .filter((cls) => cls !== "all")
        .map((c) => getClassNameArabic(c))
        .join("، ");
      if (reminder.classes.includes("all")) {
        targetClassesText = targetClassesText
          ? `${targetClassesText}، جميع الصفوف`
          : "جميع الصفوف";
      }
    } else if (currentUser && currentUser.class) {
      // للطالب - إظهار صفه فقط
      targetClassesText = getClassNameArabic(currentUser.class);
    }

    const reminderHtml = `
            <div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 card-hover">
                <div class="flex items-start">
                    <div class="bg-gradient-to-r ${
                      typeColors[reminder.type]
                    } rounded-full p-4 ml-6 mt-2 animate-bounce-gentle">
                        <span class="text-2xl">${
                          typeIcons[reminder.type]
                        }</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-2xl font-bold gradient-text">${
                              reminder.title
                            }</h3>
                            <span class="${
                              typeBadges[reminder.type]
                            } font-medium px-4 py-2 rounded-full">${
      typeLabels[reminder.type]
    }</span>
                        </div>
                        <p class="text-gray-600 mb-6 text-lg leading-relaxed">${
                          reminder.content
                        }</p>
                        <div class="flex justify-between items-center text-gray-500">
                            <span class="flex items-center">
                                🎓 ${
                                  isAdmin ? "للصفوف:" : "لصفك:"
                                } ${targetClassesText}
                            </span>
                            <span class="flex items-center">📅 ${
                              reminder.date
                            }</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    container.innerHTML += reminderHtml;
  });
}

// Print functions for excellent students
function printStudentsList() {
  const activeTab = document.querySelector(".week-tab.active");
  if (!activeTab) {
    showNotification("يرجى اختيار أسبوع أولاً", "error");
    return;
  }

  const weekName = activeTab.getAttribute("onclick").match(/'([^']+)'/)[1];
  let weekStudents = students[weekName] || [];

  // ENHANCED: تطبيق الفلترة عند الطباعة
  if (!isAdmin && currentUser && currentUser.class) {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentClass
    );
  }

  if (weekStudents.length === 0) {
    showNotification("لا توجد طلاب متميزون في هذا الأسبوع للطباعة", "warning");
    return;
  }

  const weekNameArabic = getWeekNameArabic(weekName);

  let printContent = `
    <html dir="rtl">
    <head>
      <title>قائمة الطلاب المتميزين - ${weekNameArabic}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; margin: 20px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 25px; margin-bottom: 35px; }
        .title { color: #1E40AF; font-size: 32px; font-weight: bold; margin-bottom: 15px; }
        .subtitle { color: #6B7280; margin-bottom: 12px; font-size: 18px; }
        .student-card { margin-bottom: 30px; padding: 20px; border: 2px solid #E5E7EB; border-radius: 12px; background: #F9FAFB; }
        .student-name { font-weight: bold; color: #1F2937; margin-bottom: 10px; font-size: 20px; }
        .student-quote { font-style: italic; color: #4B5563; margin-bottom: 15px; font-size: 16px; }
        .student-tags { margin-top: 10px; }
        .tag { background: #DBEAFE; color: #1E40AF; padding: 5px 12px; border-radius: 15px; margin: 3px; display: inline-block; font-size: 14px; }
        .footer { margin-top: 40px; text-align: center; color: #6B7280; border-top: 2px solid #E5E7EB; padding-top: 25px; }
        .date { color: #9CA3AF; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">🌟 قائمة الطلاب المتميزين</div>
        <div class="subtitle">${weekNameArabic}</div>
        ${
          !isAdmin && currentUser
            ? `<div class="subtitle">صف ${getClassNameArabic(
                currentUser.class
              )}</div>`
            : ""
        }
        <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString(
          "ar-SA"
        )}</div>
      </div>
  `;

  weekStudents.forEach((student, index) => {
    const classNameArabic = getClassNameArabic(student.class);
    printContent += `
      <div class="student-card">
        <div class="student-name">${index + 1}. ${student.name} ⭐</div>
        <div style="color: #6B7280; margin-bottom: 10px;">${classNameArabic}</div>
        <div class="student-quote">"${student.quote}"</div>
        <div class="student-tags">
          ${student.tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
        </div>
      </div>
    `;
  });

  printContent += `
      <div class="footer">
        <p style="font-size: 18px; font-weight: bold; color: #3B82F6;">تهانينا لجميع الطلاب المتميزين!</p>
        <p>موقع الأستاذ علي العيسني للرياضيات</p>
        <p style="font-style: italic; color: #9CA3AF;">نحو مستقبل مشرق في عالم الأرقام</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();

  showNotification("تم إعداد قائمة الطلاب المتميزين للطباعة!");
}

function shareStudentsList(platform) {
  const activeTab = document.querySelector(".week-tab.active");
  if (!activeTab) {
    showNotification("يرجى اختيار أسبوع أولاً", "error");
    return;
  }

  const weekName = activeTab.getAttribute("onclick").match(/'([^']+)'/)[1];
  let weekStudents = students[weekName] || [];

  // Filter by class if needed
  if (!isAdmin && currentUser && currentUser.class) {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentClass
    );
  }

  if (weekStudents.length === 0) {
    showNotification("لا توجد طلاب متميزون في هذا الأسبوع للمشاركة", "warning");
    return;
  }

  const weekNameArabic = getWeekNameArabic(weekName);

  let shareText = `🌟 قائمة الطلاب المتميزين - ${weekNameArabic}\n\n`;
  shareText += `📚 موقع الأستاذ علي العيسني للرياضيات\n`;
  shareText += `📅 ${new Date().toLocaleDateString("ar-SA")}\n\n`;

  weekStudents.forEach((student, index) => {
    const classNameArabic = getClassNameArabic(student.class);
    shareText += `${index + 1}. ${student.name} ⭐\n`;
    shareText += `   ${classNameArabic}\n`;
    shareText += `   "${student.quote}"\n`;
    shareText += `   التخصص: ${student.tags.join(" - ")}\n\n`;
  });

  shareText += `تهانينا لجميع الطلاب المتميزين!\n`;
  shareText += `💫 نحو مستقبل مشرق في عالم الأرقام`;

  if (platform === "whatsapp") {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
    showNotification("تم فتح واتساب للمشاركة!", "success");
  } else if (platform === "email") {
    const subject = encodeURIComponent(
      `قائمة الطلاب المتميزين - ${weekNameArabic}`
    );
    const body = encodeURIComponent(shareText);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl);
    showNotification("تم فتح تطبيق البريد الإلكتروني!", "success");
  }
}

function exportStudentsList() {
  const activeTab = document.querySelector(".week-tab.active");
  if (!activeTab) {
    showNotification("يرجى اختيار أسبوع أولاً", "error");
    return;
  }

  const weekName = activeTab.getAttribute("onclick").match(/'([^']+)'/)[1];
  let weekStudents = students[weekName] || [];

  // Filter by class if needed
  if (!isAdmin && currentUser && currentUser.class) {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    weekStudents = weekStudents.filter(
      (student) => student.class === currentClass
    );
  }

  if (weekStudents.length === 0) {
    showNotification("لا توجد طلاب متميزون في هذا الأسبوع للتصدير", "warning");
    return;
  }

  const weekNameArabic = getWeekNameArabic(weekName);

  // Create CSV content
  let csvContent = "الرقم,اسم الطالب,الصف,العبارة التحفيزية,الوسوم\n";

  weekStudents.forEach((student, index) => {
    const classNameArabic = getClassNameArabic(student.class);
    csvContent += `${index + 1},"${student.name}","${classNameArabic}","${
      student.quote
    }","${student.tags.join(" - ")}"\n`;
  });

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `الطلاب_المتميزون_${weekNameArabic}_${new Date()
      .toLocaleDateString("ar-SA")
      .replace(/\//g, "-")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification("تم تصدير قائمة الطلاب المتميزين!");
}

// Admin functions
function showAdminTab(tabName) {
  if (!isAdmin) return;

  // Update tab states
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("border-blue-600", "active");
    tab.classList.add("border-transparent");
  });

  const activeTab = document.querySelector(
    `[onclick="showAdminTab('${tabName}')"]`
  );
  if (activeTab) {
    activeTab.classList.add("border-blue-600", "active");
    activeTab.classList.remove("border-transparent");
  }

  // Load content based on tab
  const container = document.getElementById("adminContent");

  switch (tabName) {
    case "adminExams":
      loadAdminExams();
      break;
    case "adminWorksheets":
      loadAdminWorksheets();
      break;
    case "adminWeeklyPlans":
      loadAdminWeeklyPlans();
      break;
    case "adminStudents":
      loadAdminStudents();
      break;
    case "adminReminders":
      loadAdminReminders();
      break;
    case "adminPhotos":
      loadAdminPhotos();
      break;
    case "adminAchievementFiles":
      loadAdminAchievementFiles();
      break;
    case "adminCodes":
      loadAdminCodes();
      break;
    case "adminTracking":
      loadAdminTracking();
      break;
  }
}

// Enhanced admin function for achievement files management
function loadAdminAchievementFiles() {
  const container = document.getElementById("adminContent");

  const filesHtml = `
    <div class="bg-purple-50 rounded-2xl p-8 mb-8">
      <h3 class="text-2xl font-bold gradient-text mb-6">📁 إدارة ملفات الإنجاز</h3>
      <p class="text-purple-700 text-lg mb-6">
        هنا يمكنك مراجعة واعتماد ملفات الإنجاز المرفوعة من الطلاب
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">${
            achievementFiles.length
          }</div>
          <div class="text-gray-600 mt-2">إجمالي الملفات</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-yellow-600">${
            achievementFiles.filter((f) => f.status === "pending").length
          }</div>
          <div class="text-gray-600 mt-2">في الانتظار</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-600">${
            achievementFiles.filter((f) => f.status === "approved").length
          }</div>
          <div class="text-gray-600 mt-2">معتمدة</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-red-600">${
            achievementFiles.filter((f) => f.status === "rejected").length
          }</div>
          <div class="text-gray-600 mt-2">مرفوضة</div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        <thead class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <tr>
            <th class="py-4 px-6 text-right font-bold">عنوان الإنجاز</th>
            <th class="py-4 px-6 text-right font-bold">اسم الطالب</th>
            <th class="py-4 px-6 text-right font-bold">الصف</th>
            <th class="py-4 px-6 text-right font-bold">تاريخ الرفع</th>
            <th class="py-4 px-6 text-right font-bold">الحالة</th>
            <th class="py-4 px-6 text-right font-bold">التقييم</th>
            <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${achievementFiles
            .map((file) => {
              const statusColors = {
                pending: "bg-yellow-100 text-yellow-800",
                approved: "bg-green-100 text-green-800",
                rejected: "bg-red-100 text-red-800",
              };
              const statusTexts = {
                pending: "⏳ في الانتظار",
                approved: "✅ معتمد",
                rejected: "❌ مرفوض",
              };
              return `
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="py-4 px-6 font-medium">${file.title}</td>
                <td class="py-4 px-6">${file.studentName}</td>
                <td class="py-4 px-6">${getClassNameArabic(file.class)}</td>
                <td class="py-4 px-6">${file.submissionDate}</td>
                <td class="py-4 px-6">
                  <span class="px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[file.status]
                  }">
                    ${statusTexts[file.status]}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="text-yellow-400">${"⭐".repeat(
                    file.rating
                  )}</span>
                  <span class="text-gray-500">(${file.rating}/5)</span>
                </td>
                <td class="py-4 px-6">
                  <div class="flex space-x-2 space-x-reverse">
                    <button onclick="viewAchievementFile(${
                      file.id
                    })" class="text-blue-600 hover:text-blue-800 transition-colors duration-200" title="عرض">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button onclick="deleteAchievementFile(${
                      file.id
                    })" class="text-red-600 hover:text-red-800 transition-colors duration-200" title="حذف">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = filesHtml;
}

function viewAchievementFile(fileId) {
  const file = achievementFiles.find((f) => f.id === fileId);
  if (!file) return;

  const filePreview = file.fileType.startsWith("image/")
    ? `<img src="${file.fileData}" style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px;" />`
    : `<div style="background: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
      <svg style="width: 48px; height: 48px; color: #dc2626; margin: 0 auto 10px;" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
      </svg>
      <p style="color: #dc2626; font-weight: bold;">${file.fileName}</p>
    </div>`;

  const statusText = {
    pending: "⏳ في الانتظار",
    approved: "✅ معتمد",
    rejected: "❌ مرفوض",
  };

  let fileDetails = `
    <div style="text-align: right; direction: rtl;">
      <h3 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1f2937;">${
        file.title
      }</h3>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p><strong>الطالب:</strong> ${file.studentName}</p>
        <p><strong>الصف:</strong> ${getClassNameArabic(file.class)}</p>
        <p><strong>تاريخ الرفع:</strong> ${file.submissionDate}</p>
        <p><strong>الحالة:</strong> ${statusText[file.status]}</p>
        ${
          file.rating > 0
            ? `<p><strong>التقييم:</strong> ${"⭐".repeat(file.rating)} (${
                file.rating
              }/5)</p>`
            : ""
        }
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="font-weight: bold; margin-bottom: 10px;">وصف الإنجاز:</h4>
        <p style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">${
          file.description
        }</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="font-weight: bold; margin-bottom: 10px;">الملف:</h4>
        ${filePreview}
      </div>
      
      ${
        file.teacherComment
          ? `
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h4 style="font-weight: bold; margin-bottom: 10px; color: #1e40af;">تعليق المعلم:</h4>
          <p style="color: #1e40af;">${file.teacherComment}</p>
        </div>
      `
          : ""
      }
    </div>
  `;

  Swal.fire({
    title: "تفاصيل ملف الإنجاز",
    html: fileDetails,
    showConfirmButton: true,
    confirmButtonText: "إغلاق",
    confirmButtonColor: "#3b82f6",
    width: 700,
  });
}

function deleteAchievementFile(fileId) {
  if (confirm("هل أنت متأكد من حذف ملف الإنجاز هذا؟")) {
    const file = achievementFiles.find((f) => f.id === fileId);
    if (file && studentUploadCounts[file.studentName] > 0) {
      // Decrease upload count when deleting
      studentUploadCounts[file.studentName]--;
      localStorage.setItem(
        "studentUploadCounts",
        JSON.stringify(studentUploadCounts)
      );
    }

    achievementFiles = achievementFiles.filter((f) => f.id !== fileId);
    localStorage.setItem("achievementFiles", JSON.stringify(achievementFiles));
    loadAdminAchievementFiles();
    loadAchievementFiles();
    showNotification("تم حذف ملف الإنجاز بنجاح");
  }
}

// Enhanced admin function for photo achievements management
function loadAdminPhotos() {
  const container = document.getElementById("adminContent");

  const photosHtml = `
    <div class="bg-purple-50 rounded-2xl p-8 mb-8">
      <h3 class="text-2xl font-bold gradient-text mb-6">📸 إدارة الإنجازات المصورة</h3>
      <p class="text-purple-700 text-lg mb-6">
        هنا يمكنك إدارة الإنجازات المصورة ومراقبة التفاعلات
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">${
            photoAchievements.length
          }</div>
          <div class="text-gray-600 mt-2">إجمالي الإنجازات</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">${photoAchievements.reduce(
            (sum, p) => {
              const totalReactions = p.reactions
                ? Object.values(p.reactions).reduce((a, b) => a + b, 0)
                : 0;
              return sum + totalReactions;
            },
            0
          )}</div>
          <div class="text-gray-600 mt-2">إجمالي التفاعلات</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-600">${Math.round(
            photoAchievements.reduce((sum, p) => {
              const totalReactions = p.reactions
                ? Object.values(p.reactions).reduce((a, b) => a + b, 0)
                : 0;
              return sum + totalReactions;
            }, 0) / Math.max(photoAchievements.length, 1)
          )}</div>
          <div class="text-gray-600 mt-2">متوسط التفاعل</div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        <thead class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <tr>
            <th class="py-4 px-6 text-right font-bold">عنوان الإنجاز</th>
            <th class="py-4 px-6 text-right font-bold">الصف</th>
            <th class="py-4 px-6 text-right font-bold">تاريخ النشر</th>
            <th class="py-4 px-6 text-right font-bold">التفاعلات</th>
            <th class="py-4 px-6 text-right font-bold">التعليقات</th>
            <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${photoAchievements
            .map((achievement) => {
              const totalReactions = achievement.reactions
                ? Object.values(achievement.reactions).reduce(
                    (a, b) => a + b,
                    0
                  )
                : 0;
              const totalComments = achievement.comments
                ? achievement.comments.length
                : 0;
              return `
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="py-4 px-6 font-medium">${achievement.title}</td>
                <td class="py-4 px-6">${getClassNameArabic(
                  achievement.class
                )}</td>
                <td class="py-4 px-6">${achievement.date}</td>
                <td class="py-4 px-6">
                  <span class="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">${totalReactions}</span>
                </td>
                <td class="py-4 px-6">
                  <span class="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">${totalComments}</span>
                </td>
                <td class="py-4 px-6">
                  <button onclick="deletePhotoAchievement(${
                    achievement.id
                  })" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = photosHtml;
}

function deletePhotoAchievement(id) {
  if (confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) {
    photoAchievements = photoAchievements.filter((p) => p.id !== id);
    localStorage.setItem(
      "photoAchievements",
      JSON.stringify(photoAchievements)
    );
    loadAdminPhotos();
    loadPhotoAchievements();
    showNotification("تم حذف الإنجاز بنجاح");
  }
}

// Enhanced admin function for tracking management
function loadAdminTracking() {
  const container = document.getElementById("adminContent");

  const trackingHtml = `
    <div class="bg-blue-50 rounded-2xl p-8 mb-8">
      <h3 class="text-2xl font-bold gradient-text mb-6">📊 إدارة متابعة الطلاب المتطورة</h3>
      <p class="text-blue-700 text-lg mb-6">
        هنا يمكنك إدارة أكواد المتابعة للطلاب ومراجعة تقاريرهم المفصلة
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white rounded-xl p-6">
          <h4 class="font-bold text-gray-800 mb-4">📋 إحصائيات عامة</h4>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span>إجمالي الطلاب:</span>
              <span class="font-bold text-blue-600">${
                Object.keys(studentCodes).length
              }</span>
            </div>
            <div class="flex justify-between">
              <span>الطلاب المتابعين:</span>
              <span class="font-bold text-green-600">${
                Object.keys(studentTracking).length
              }</span>
            </div>
            <div class="flex justify-between">
              <span>معدل المتابعة:</span>
              <span class="font-bold text-purple-600">${Math.round(
                (Object.keys(studentTracking).length /
                  Math.max(Object.keys(studentCodes).length, 1)) *
                  100
              )}%</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6">
          <h4 class="font-bold text-gray-800 mb-4">🔧 أدوات سريعة</h4>
          <div class="space-y-3">
            <button onclick="generateTrackingCodes()" class="w-full btn-primary py-3 rounded-lg">
              🔐 إنشاء أكواد متابعة
            </button>
            <button onclick="exportTrackingReport()" class="w-full btn-secondary py-3 rounded-lg">
              📊 تصدير تقرير شامل
            </button>
            <button onclick="resetAllTracking()" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg">
              🗑️ إعادة تعيين البيانات
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Students Tracking Table -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <h4 class="text-xl font-bold gradient-text mb-6">📋 قائمة متابعة الطلاب</h4>
      
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-xl overflow-hidden">
          <thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <tr>
              <th class="py-4 px-6 text-right font-bold">اسم الطالب</th>
              <th class="py-4 px-6 text-right font-bold">الصف</th>
              <th class="py-4 px-6 text-right font-bold">كود المتابعة</th>
              <th class="py-4 px-6 text-right font-bold">آخر تحديث</th>
              <th class="py-4 px-6 text-right font-bold">الحالة</th>
              <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${Object.keys(studentCodes)
              .map((studentName) => {
                const hasTracking = studentTracking[studentName];
                const lastUpdate = hasTracking
                  ? getLastUpdateDate(studentTracking[studentName])
                  : "لم يتم التحديث";
                const studentClass = studentCodes[studentName].class;

                return `
                <tr class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="py-4 px-6 font-medium">${studentName}</td>
                  <td class="py-4 px-6">${getClassNameArabic(studentClass)}</td>
                  <td class="py-4 px-6">
                    <span class="bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1 rounded-full">${
                      studentCodes[studentName].code
                    }</span>
                  </td>
                  <td class="py-4 px-6 text-sm text-gray-600">${lastUpdate}</td>
                  <td class="py-4 px-6">
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${
                      hasTracking
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }">
                      ${hasTracking ? "✅ نشط" : "⏳ في الانتظار"}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex space-x-2 space-x-reverse">
                      <button onclick="editStudentTracking('${studentName}')" class="text-blue-600 hover:text-blue-800 transition-colors duration-200" title="تعديل">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button onclick="viewStudentTracking('${studentName}')" class="text-green-600 hover:text-green-800 transition-colors duration-200" title="عرض">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = trackingHtml;
}

function getLastUpdateDate(studentData) {
  let lastDate = null;
  Object.values(studentData).forEach((weekData) => {
    if (weekData.days) {
      Object.values(weekData.days).forEach((dayData) => {
        if (dayData.lastUpdated) {
          if (!lastDate || new Date(dayData.lastUpdated) > new Date(lastDate)) {
            lastDate = dayData.lastUpdated;
          }
        }
      });
    }
  });
  return lastDate || "لم يتم التحديث";
}

function generateTrackingCodes() {
  showNotification("أكواد المتابعة متاحة بالفعل لجميع الطلاب!", "info");
}

function exportTrackingReport() {
  let reportContent =
    "اسم الطالب,الصف,كود المتابعة,نسبة الحضور,نسبة الواجبات,نسبة الاختبارات,السلوك,آخر تحديث\n";

  Object.keys(studentCodes).forEach((studentName) => {
    const studentData = studentTracking[studentName];
    const studentClass = getClassNameArabic(studentCodes[studentName].class);
    const attendance = studentData
      ? calculateOverallAttendance(studentData)
      : 0;
    const homework = studentData ? calculateOverallHomework(studentData) : 0;
    const tests = studentData ? calculateOverallTests(studentData) : 0;
    const behavior = studentData
      ? calculateOverallBehavior(studentData)
      : "غير محدد";
    const lastUpdate = studentData
      ? getLastUpdateDate(studentData)
      : "لم يتم التحديث";

    reportContent += `"${studentName}","${studentClass}","${studentCodes[studentName].code}","${attendance}%","${homework}%","${tests}%","${behavior}","${lastUpdate}"\n`;
  });

  const blob = new Blob([reportContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `تقرير_متابعة_الطلاب_${new Date()
      .toLocaleDateString("ar-SA")
      .replace(/\//g, "-")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification("تم تصدير تقرير المتابعة!");
}

function resetAllTracking() {
  if (
    confirm(
      "هل أنت متأكد من إعادة تعيين جميع بيانات المتابعة؟ هذا الإجراء لا يمكن التراجع عنه."
    )
  ) {
    studentTracking = {};
    localStorage.setItem("studentTracking", JSON.stringify(studentTracking));
    loadAdminTracking();
    showNotification("تم إعادة تعيين جميع بيانات المتابعة!");
  }
}

function editStudentTracking(studentName) {
  // Switch to student tracking section and load this student
  showSection("studentTracking");

  // Show teacher panel
  document.getElementById("teacherManagementPanel").classList.remove("hidden");

  // Set student class and name in dropdowns
  const studentClass = studentCodes[studentName].class;
  const classSelect = document.getElementById("teacherClassSelect");
  const studentSelect = document.getElementById("teacherStudentSelect");

  if (classSelect && studentSelect) {
    classSelect.value = studentClass;
    loadStudentsByClass();
    setTimeout(() => {
      studentSelect.value = studentName;
      loadStudentForAdvancedEditing();
    }, 100);
  }

  showNotification(`تم تحميل بيانات ${studentName} للتعديل`, "info");
}

function viewStudentTracking(studentName) {
  // Switch to student tracking section and show this student's progress
  showSection("studentTracking");

  // Hide access form and show progress
  document.getElementById("studentCodeAccess").classList.add("hidden");
  document.getElementById("studentProgressContent").classList.remove("hidden");

  loadEnhancedStudentProgress(studentName);
  showNotification(`تم عرض سجل ${studentName}`, "info");
}

// Enhanced exam creation with improved interface and existing exams display
function loadAdminExams() {
  const container = document.getElementById("adminContent");

  const examsHtml = `
    <!-- Enhanced Action Bar -->
    <div class="exam-actions-bar">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="bg-blue-100 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold gradient-text">إدارة الاختبارات المتطورة</h3>
            <p class="text-blue-700">يمكنك الان إنشاء الاختبارات بسهولة</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button onclick="createNewExam()" class="success-gradient hover:shadow-2xl text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center interactive-button text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            ➕ إنشاء اختبار جديد
          </button>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Existing Exams Display -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex justify-between items-center mb-8">
        <h4 class="text-2xl font-bold gradient-text flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ml-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
           الاختبارات الموجودة (${exams.length})
        </h4>
        <div class="bg-blue-50 px-4 py-2 rounded-lg">
          <span class="text-blue-800 font-medium">إجمالي الأسئلة: ${exams.reduce(
            (sum, exam) => sum + exam.questions.length,
            0
          )}</span>
        </div>
      </div>

      ${
        exams.length === 0
          ? `
        <div class="text-center py-12">
          <div class="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-4">لا توجد اختبارات بعد</h3>
          <p class="text-gray-500 text-lg mb-6">ابدأ بإنشاء أول اختبار لطلابك</p>
          <button onclick="createNewExam()" class="success-gradient hover:shadow-xl text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
            🚀 إنشاء أول اختبار
          </button>
        </div>
      `
          : `
        <div class="existing-exams-grid">
          ${exams
            .map((exam) => {
              let statusBadge = "";
              if (exam.publishDate && exam.publishTime) {
                const publishDateTime = new Date(
                  `${exam.publishDate}T${exam.publishTime}`
                );
                const now = new Date();

                if (!exam.isPublished && publishDateTime > now) {
                  statusBadge = `
                    <div class="scheduled-exam-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      مجدول: ${exam.publishDate} ${exam.publishTime}
                    </div>
                  `;
                }
              }

              if (exam.status === "draft") {
                statusBadge = `
                  <div class="scheduled-exam-badge draft-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    مسودة
                  </div>
                `;
              }

              return `
              <div class="exam-management-card">
                <div class="exam-badge">${exam.questions.length} سؤال</div>
                ${statusBadge}
                
                <div class="mb-4">
                  <div class="flex justify-between items-start mb-3">
                    <h5 class="text-xl font-bold text-gray-800 flex-1">${
                      exam.title
                    }</h5>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${
                      exam.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }">
                      ${exam.status === "published" ? "✅ منشور" : "📝 مسودة"}
                    </span>
                  </div>
                  <p class="text-gray-600 text-sm leading-relaxed">${
                    exam.description
                  }</p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-blue-600">${
                      exam.duration
                    }</div>
                    <div class="text-xs text-blue-600">دقيقة</div>
                  </div>
                  <div class="bg-green-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-green-600">${
                      exam.questions.length
                    }</div>
                    <div class="text-xs text-green-600">سؤال</div>
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-sm text-gray-600 mb-2">الصفوف المستهدفة:</div>
                  <div class="flex flex-wrap gap-2">
                    ${exam.classes
                      .map(
                        (cls) => `
                      <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        ${getClassNameArabic(cls)}
                      </span>
                    `
                      )
                      .join("")}
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="editExam('${
                    exam.id
                  }')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                     تعديل
                  </button>
                  <button onclick="duplicateExam('${
                    exam.id
                  }')" class="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105" title="نسخ الاختبار">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button onclick="deleteExam('${
                    exam.id
                  }')" class="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105" title="حذف الاختبار">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      `
      }
    </div>
  `;

  container.innerHTML = examsHtml;
}

// FIXED: New function to create a new exam with proper state management and attempt tracking
function createNewExam() {
  // FIXED: Prevent creating new exam if save is in progress
  if (examSaveInProgress) {
    showNotification("يرجى انتظار انتهاء العملية الحالية", "warning");
    return;
  }

  // Set editing state for new exam
  isEditing = true;
  editingExamId = null;
  examSaveInProgress = false;
  saveAttempts = 0; // FIXED: Reset save attempts
  lastSaveTime = 0; // FIXED: Reset last save time
  currentExamData = {
    title: "",
    description: "",
    duration: 10,
    classes: [],
    publishDate: null,
    publishTime: null,
    isPublished: false,
    status: "draft",
    questions: [
      {
        id: Date.now(),
        text: "",
        type: "mcq",
        options: ["", "", "", ""],
        correctAnswer: 0,
        image: null,
      },
    ],
  };

  // Show Modern exam editor for new exam
  showModernExamEditorNew();
}

function showModernExamEditorNew() {
  const editorSection = document.getElementById("examEditor");

  const editorHtml = `
    <div class="modern-exam-container p-8">
      <!-- Modern Exam Header -->
      <div class="exam-header-modern">
        <div class="exam-title-section">
          <h2>إنشاء اختبار جديد</h2>
          <p>صمم اختبارات احترافية بتقنيات حديثة وتصميم أنيق</p>
        </div>
        <div class="exam-form-content">
          <div class="space-y-8">
            <div>
              <label class="block text-gray-700 mb-4 font-bold text-xl">عنوان الاختبار</label>
              <input 
                type="text" 
                id="examTitle" 
                value=""
                class="question-input-modern"
                placeholder="اكتب عنوان الاختبار المميز..."
                onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-4 font-bold text-lg">وصف الاختبار (اختياري)</label>
              <textarea 
                id="examDescription" 
                rows="4"
                class="question-input-modern"
                placeholder="اكتب وصفاً جذاباً للاختبار... (يمكن تركه فارغاً)"
                onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
              ></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label class="block text-gray-700 mb-4 font-bold text-lg">⏰ مدة الاختبار (بالدقائق)</label>
                <input 
                  type="number" 
                  id="examDuration" 
                  value="10"
                  min="1" 
                  max="120"
                  class="question-input-modern"
                  placeholder="مثال: 15"
                  onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                  onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-4 font-bold text-lg">🎯 الصفوف المستهدفة</label>
                <!-- تحسين اختيار الصفوف -->
                <div class="class-selection-modern">
                  <div class="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h4 class="text-lg font-bold text-gray-800">اختر الصفوف المستهدفة</h4>
                  </div>
                  <p class="text-gray-600 mb-4">يمكنك اختيار صف واحد أو عدة صفوف</p>
                  
                  <div class="class-selection-grid">
                    <label class="class-checkbox-card">
                      <input type="checkbox" class="class-checkbox-input" value="class5A" onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">الخامس أ</div>
                      <div class="text-sm text-gray-500">الصف الخامس الابتدائي</div>
                    </label>
                    
                    <label class="class-checkbox-card">
                      <input type="checkbox" class="class-checkbox-input" value="class6D" onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">السادس د</div>
                      <div class="text-sm text-gray-500">الصف السادس الابتدائي</div>
                    </label>
                    
                    <label class="class-checkbox-card">
                      <input type="checkbox" class="class-checkbox-input" value="class6H" onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">السادس هـ</div>
                      <div class="text-sm text-gray-500">الصف السادس الابتدائي</div>
                    </label>
                  </div>
                  
                  <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-blue-800 text-sm">
                      💡 <strong>نصيحة:</strong> اختر الصفوف التي تريد إتاحة الاختبار لها. يمكنك اختيار أكثر من صف واحد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Schedule Card -->
      <div class="exam-schedule-modern">
        <div class="flex items-center mb-6">
          <div class="bg-orange-100 rounded-full p-4 mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-orange-800">⏰ جدولة النشر الذكية</h3>
            <p class="text-orange-700 text-lg">تحكم في توقيت إتاحة الاختبار للطلاب</p>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-8 border-2 border-orange-200">
          <div class="flex items-center mb-6">
            <input 
              type="checkbox" 
              id="scheduleExam" 
              class="w-6 h-6 text-orange-600 ml-4 rounded"
              onchange="toggleScheduleInputs()"
            />
            <label for="scheduleExam" class="font-bold text-gray-800 text-lg">🕐 تفعيل الجدولة الزمنية</label>
          </div>
          
          <div id="scheduleInputs" class="hidden">
            <div class="schedule-input-group-modern">
              <div>
                <label class="block text-gray-700 mb-3 font-bold">📅 تاريخ النشر</label>
                <input 
                  type="date" 
                  id="publishDate" 
                  class="schedule-input-modern"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-3 font-bold">🕐 وقت النشر</label>
                <input 
                  type="time" 
                  id="publishTime" 
                  class="schedule-input-modern"
                />
              </div>
            </div>
            <div class="mt-6 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <p class="text-orange-800 text-lg font-medium">
                💡 <strong>ملاحظة مهمة:</strong> إذا لم يتم تحديد جدولة، سيتم نشر الاختبار فوراً عند الحفظ
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Questions Section -->
      <div id="questionsSection">
        ${generateModernQuestionsEditor(currentExamData.questions)}
      </div>

      <!-- Modern Add Question Button -->
      <div class="add-question-btn-modern" onclick="addNewQuestion()">
        <div class="flex items-center justify-center relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="text-xl font-bold">إضافة سؤال جديد</span>
        </div>
      </div>

      <!-- Modern Save Bar -->
      <div class="exam-save-bar-modern">
        <div class="save-status-modern" id="saveStatus">
          <div class="save-icon-modern" id="saveIcon"></div>
          <span class="text-lg font-bold">جميع التغييرات محفوظة تلقائياً</span>
        </div>
        <div class="flex gap-6">
          <button onclick="cancelExamEdit()" class="modern-button btn-secondary-modern">
            ❌ إلغاء التعديل
          </button>
          <button onclick="saveNewExamAsDraft()" class="modern-button btn-warning-modern">
            📝 حفظ كمسودة
          </button>
          <button onclick="saveNewExam()" class="modern-button btn-success-modern">
            ✔ نشر الاختبار
          </button>
        </div>
      </div>
    </div>
  `;

  editorSection.innerHTML = editorHtml;
  showSection("examEditor");

  showNotification("تم فتح الواجهة المتطورة لإنشاء اختبار جديد! ", "info");
}

// تحسين اختيار الصفوف - New function to update selected classes
function updateSelectedClasses() {
  const checkboxes = document.querySelectorAll(".class-checkbox-input");
  checkboxes.forEach((checkbox) => {
    const card = checkbox.closest(".class-checkbox-card");
    if (checkbox.checked) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

// FIXED: Enhanced exam editor functions with improved class selection
function editExam(examId) {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  // FIXED: Prevent editing if already in progress
  if (examSaveInProgress) {
    showNotification("يرجى انتظار انتهاء العملية الحالية", "warning");
    return;
  }

  const exam = exams.find((e) => e.id === examId);
  if (!exam) return;

  // FIXED: Reset editing state properly
  isEditing = true;
  editingExamId = examId;
  currentExamData = JSON.parse(JSON.stringify(exam)); // Deep copy to avoid reference issues
  examSaveInProgress = false;
  saveAttempts = 0; // FIXED: Reset save attempts
  lastSaveTime = 0; // FIXED: Reset last save time

  // Show Modern exam editor
  showModernExamEditor(exam);
}

function showModernExamEditor(exam) {
  const editorSection = document.getElementById("examEditor");

  const editorHtml = `
    <div class="modern-exam-container p-8">
      <!-- Modern Exam Header -->
      <div class="exam-header-modern">
        <div class="exam-title-section">
          <h2>تحرير الاختبار</h2>
          <p>أنشئ اختبارات احترافية</p>
        </div>
        <div class="exam-form-content">
          <div class="space-y-8">
            <div>
              <label class="block text-gray-700 mb-4 font-bold text-xl"> عنوان الاختبار</label>
              <input 
                type="text" 
                id="examTitle" 
                value="${exam.title}"
                class="question-input-modern"
                placeholder="اكتب عنوان الاختبار المميز..."
                onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-4 font-bold text-lg"> وصف الاختبار (اختياري)</label>
              <textarea 
                id="examDescription" 
                rows="4"
                class="question-input-modern"
                placeholder="اكتب وصفاً جذاباً للاختبار... (يمكن تركه فارغاً)"
                onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
              >${exam.description || ""}</textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label class="block text-gray-700 mb-4 font-bold text-lg">⏰ مدة الاختبار (بالدقائق)</label>
                <input 
                  type="number" 
                  id="examDuration" 
                  value="${exam.duration}"
                  min="1" 
                  max="120"
                  class="question-input-modern"
                  placeholder="مثال: 15"
                  onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
                  onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-4 font-bold text-lg">🎯 الصفوف المستهدفة</label>
                <!-- تحسين اختيار الصفوف -->
                <div class="class-selection-modern">
                  <div class="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h4 class="text-lg font-bold text-gray-800">اختر الصفوف المستهدفة</h4>
                  </div>
                  <p class="text-gray-600 mb-4">يمكنك اختيار صف واحد أو عدة صفوف</p>
                  
                  <div class="class-selection-grid">
                    <label class="class-checkbox-card ${
                      exam.classes.includes("class5A") ? "selected" : ""
                    }">
                      <input type="checkbox" class="class-checkbox-input" value="class5A" ${
                        exam.classes.includes("class5A") ? "checked" : ""
                      } onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">الخامس أ</div>
                      <div class="text-sm text-gray-500">الصف الخامس الابتدائي</div>
                    </label>
                    
                    <label class="class-checkbox-card ${
                      exam.classes.includes("class6D") ? "selected" : ""
                    }">
                      <input type="checkbox" class="class-checkbox-input" value="class6D" ${
                        exam.classes.includes("class6D") ? "checked" : ""
                      } onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">السادس د</div>
                      <div class="text-sm text-gray-500">الصف السادس الابتدائي</div>
                    </label>
                    
                    <label class="class-checkbox-card ${
                      exam.classes.includes("class6H") ? "selected" : ""
                    }">
                      <input type="checkbox" class="class-checkbox-input" value="class6H" ${
                        exam.classes.includes("class6H") ? "checked" : ""
                      } onchange="updateSelectedClasses()">
                      <div class="class-checkbox-label">السادس هـ</div>
                      <div class="text-sm text-gray-500">الصف السادس الابتدائي</div>
                    </label>
                  </div>
                  
                  <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-blue-800 text-sm">
                      💡 <strong>نصيحة:</strong> اختر الصفوف التي تريد إتاحة الاختبار لها. يمكنك اختيار أكثر من صف واحد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Schedule Card -->
      <div class="exam-schedule-modern">
        <div class="flex items-center mb-6">
          <div class="bg-orange-100 rounded-full p-4 mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-orange-800">⏰ جدولة النشر الذكية</h3>
            <p class="text-orange-700 text-lg">تحكم في توقيت إتاحة الاختبار للطلاب</p>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-8 border-2 border-orange-200">
          <div class="flex items-center mb-6">
            <input 
              type="checkbox" 
              id="scheduleExam" 
              ${exam.publishDate ? "checked" : ""}
              class="w-6 h-6 text-orange-600 ml-4 rounded"
              onchange="toggleScheduleInputs()"
            />
            <label for="scheduleExam" class="font-bold text-gray-800 text-lg">🕐 تفعيل الجدولة الزمنية</label>
          </div>
          
          <div id="scheduleInputs" class="${exam.publishDate ? "" : "hidden"}">
            <div class="schedule-input-group-modern">
              <div>
                <label class="block text-gray-700 mb-3 font-bold">📅 تاريخ النشر</label>
                <input 
                  type="date" 
                  id="publishDate" 
                  value="${exam.publishDate || ""}"
                  class="schedule-input-modern"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-3 font-bold">🕐 وقت النشر</label>
                <input 
                  type="time" 
                  id="publishTime" 
                  value="${exam.publishTime || ""}"
                  class="schedule-input-modern"
                />
              </div>
            </div>
            <div class="mt-6 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <p class="text-orange-800 text-lg font-medium">
                💡 <strong>ملاحظة مهمة:</strong> إذا لم يتم تحديد جدولة، سيتم نشر الاختبار فوراً عند الحفظ
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Questions Section -->
      <div id="questionsSection">
        ${generateModernQuestionsEditor(currentExamData.questions)}
      </div>

      <!-- Modern Add Question Button -->
      <div class="add-question-btn-modern" onclick="addNewQuestion()">
        <div class="flex items-center justify-center relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="text-xl font-bold">✨ إضافة سؤال جديد</span>
        </div>
      </div>

      <!-- Modern Save Bar -->
      <div class="exam-save-bar-modern">
        <div class="save-status-modern" id="saveStatus">
          <div class="save-icon-modern" id="saveIcon"></div>
          <span class="text-lg font-bold">جميع التغييرات محفوظة تلقائياً</span>
        </div>
        <div class="flex gap-6">
          <button onclick="cancelExamEdit()" class="modern-button btn-secondary-modern">
            ❌ إلغاء التعديل
          </button>
          <button onclick="saveExamAsDraft()" class="modern-button btn-warning-modern">
            📝 حفظ كمسودة
          </button>
          <button onclick="saveExamChanges()" class="modern-button btn-success-modern">
            🚀 نشر الاختبار
          </button>
        </div>
      </div>
    </div>
  `;

  editorSection.innerHTML = editorHtml;
  showSection("examEditor");

  showNotification("تم تحميل الواجهة المتطورة للتعديل! ", "info");
}

// FIXED: Enhanced questions editor with modern design
function generateModernQuestionsEditor(questions) {
  return questions
    .map(
      (question, index) => `
    <div class="modern-question-card" data-question-id="${question.id}">
      <div class="question-number-badge">
        السؤال ${index + 1}
      </div>
      
      <div class="question-toolbar-modern">
        <button class="toolbar-btn-modern" onclick="moveQuestionUp(${index})" title="نقل لأعلى" ${
        index === 0 ? 'disabled style="opacity: 0.4;"' : ""
      }>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button class="toolbar-btn-modern" onclick="moveQuestionDown(${index})" title="نقل لأسفل" ${
        index === questions.length - 1 ? 'disabled style="opacity: 0.4;"' : ""
      }>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button class="toolbar-btn-modern" onclick="duplicateQuestion(${index})" title="نسخ السؤال">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button class="toolbar-btn-modern" onclick="deleteQuestion(${index})" title="حذف السؤال">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <div class="question-content-modern">
        <div class="question-type-selector-modern">
          <div class="flex items-center gap-4">
            <div class="bg-blue-100 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="font-bold text-gray-800 text-lg">نوع السؤال</h4>
              <p class="text-gray-600">اختر النوع المناسب لسؤالك</p>
            </div>
            
            <!-- Modern Type Toggle -->
            <div class="type-toggle-modern">
              <button 
                type="button"
                class="type-option-modern ${
                  question.type === "mcq" ? "active" : ""
                }"
                onclick="changeQuestionType(${index}, 'mcq')"
              >
                🔘 اختيار من متعدد
              </button>
              <button 
                type="button"
                class="type-option-modern ${
                  question.type === "essay" ? "active" : ""
                }"
                onclick="changeQuestionType(${index}, 'essay')"
              >
                📝 سؤال مقالي
              </button>
            </div>
          </div>
        </div>
        
        <input 
          type="text" 
          value="${question.text}"
          class="question-input-modern"
          placeholder="✍️ اكتب نص السؤال هنا..."
          data-question-index="${index}"
          onchange="updateQuestionText(${index}, this.value)"
          onfocus="this.parentElement.parentElement.classList.add('focused')"
          onblur="this.parentElement.parentElement.classList.remove('focused')"
        />
        
        ${
          question.image
            ? `
          <div class="mt-6 text-center">
            <img src="${question.image}" class="image-preview-modern" onclick="showImageModal('${question.image}')" />
            <button onclick="removeQuestionImage(${index})" class="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300">
              🗑️ إزالة الصورة
            </button>
          </div>
        `
            : `
          <div class="image-upload-modern mt-6" onclick="uploadQuestionImage(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 text-lg font-bold">📸 إضافة صورة للسؤال</p>
            <p class="text-gray-500 text-sm mt-2">اضغط لاختيار صورة توضيحية</p>
          </div>
        `
        }
        
        <!-- Modern Question Content Based on Type -->
        <div id="questionContent-${index}">
          ${generateModernQuestionContent(question, index)}
        </div>
      </div>
      
      <div class="question-actions-modern">
        <div class="flex items-center text-gray-600 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-lg">${
            question.type === "mcq"
              ? "💡 اضغط على الدائرة لتحديد الإجابة الصحيحة"
              : "📝 سؤال مقالي - سيتم تقييمه يدوياً"
          }</span>
        </div>
        <button onclick="deleteQuestion(${index})" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
          🗑️ حذف السؤال
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// NEW: Generate modern question content based on type
function generateModernQuestionContent(question, index) {
  if (question.type === "mcq") {
    return `
      <div class="options-container-modern quiz-question-container">
        ${question.options
          .map(
            (option, optionIndex) => `
          <div class="option-item-modern">
            <div 
              class="option-radio-modern ${
                optionIndex === question.correctAnswer ? "correct" : ""
              }" 
              onclick="setCorrectAnswer(${index}, ${optionIndex})"
            ></div>
            <input 
              type="text" 
              value="${option}"
              class="option-input-modern"
              placeholder="✏️ الخيار ${optionIndex + 1}"
              onchange="updateOption(${index}, ${optionIndex}, this.value)"
              onfocus="this.parentElement.parentElement.parentElement.parentElement.classList.add('focused')"
              onblur="this.parentElement.parentElement.parentElement.parentElement.classList.remove('focused')"
            />
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else if (question.type === "essay") {
    return `
      <div class="essay-question-modern">
        <div class="essay-answer-preview">
          <div class="flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span class="text-lg font-bold text-green-700">منطقة الإجابة المقالية</span>
          </div>
          <p class="text-gray-500 text-lg">سيتم عرض مربع نص للطلاب للكتابة</p>
          <p class="text-sm text-gray-400 mt-3">💭 مساحة واسعة للإبداع والتعبير</p>
        </div>
        <div class="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h5 class="font-bold text-green-800 mb-4 text-lg">💡 نصائح للأسئلة المقالية المتميزة:</h5>
          <ul class="text-green-700 space-y-2">
            <li class="flex items-center">• اكتب سؤالاً واضحاً ومحدداً</li>
            <li class="flex items-center">• حدد المطلوب من الطالب بدقة</li>
            <li class="flex items-center">• ستحتاج لتقييم الإجابات يدوياً</li>
            <li class="flex items-center">• استخدم أسئلة تحفز التفكير النقدي</li>
          </ul>
        </div>
      </div>
    `;
  }
}

// NEW: Change question type function with modern design
function changeQuestionType(questionIndex, newType) {
  if (!currentExamData || !currentExamData.questions[questionIndex]) return;

  const question = currentExamData.questions[questionIndex];

  // Don't change if already the same type
  if (question.type === newType) return;

  // Update question type
  question.type = newType;

  // Reset question data based on new type
  if (newType === "mcq") {
    question.options = ["", "", "", ""];
    question.correctAnswer = 0;
  } else if (newType === "essay") {
    question.options = [];
    question.correctAnswer = null;
  }

  // Regenerate the specific question content
  const questionContentDiv = document.getElementById(
    `questionContent-${questionIndex}`
  );
  if (questionContentDiv) {
    questionContentDiv.innerHTML = generateModernQuestionContent(
      question,
      questionIndex
    );
  }

  // Update type toggle buttons
  const questionCard = document.querySelector(
    `[data-question-id="${question.id}"]`
  );
  const typeButtons = questionCard.querySelectorAll(".type-option-modern");
  typeButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  questionCard
    .querySelector(
      `[onclick="changeQuestionType(${questionIndex}, '${newType}')"]`
    )
    .classList.add("active");

  updateModernSaveStatus("saving");
  showNotification(
    `تم تغيير نوع السؤال إلى ${
      newType === "mcq" ? "اختيار من متعدد" : "مقالي"
    } ✨`,
    "info"
  );
}

function toggleScheduleInputs() {
  const checkbox = document.getElementById("scheduleExam");
  const inputs = document.getElementById("scheduleInputs");

  if (checkbox.checked) {
    inputs.classList.remove("hidden");
  } else {
    inputs.classList.add("hidden");
    // Clear values when unchecked
    document.getElementById("publishDate").value = "";
    document.getElementById("publishTime").value = "";
  }
}

function updateQuestionText(index, text) {
  if (currentExamData && currentExamData.questions[index]) {
    currentExamData.questions[index].text = text;
    updateModernSaveStatus("saving");
  }
}

function updateOption(questionIndex, optionIndex, value) {
  if (currentExamData && currentExamData.questions[questionIndex]) {
    currentExamData.questions[questionIndex].options[optionIndex] = value;
    updateModernSaveStatus("saving");
  }
}

function setCorrectAnswer(questionIndex, optionIndex) {
  if (currentExamData && currentExamData.questions[questionIndex]) {
    currentExamData.questions[questionIndex].correctAnswer = optionIndex;

    // Update UI
    const questionCard = document.querySelector(
      `[data-question-id="${currentExamData.questions[questionIndex].id}"]`
    );
    const radios = questionCard.querySelectorAll(".option-radio-modern");
    radios.forEach((radio, index) => {
      if (index === optionIndex) {
        radio.classList.add("correct");
      } else {
        radio.classList.remove("correct");
      }
    });

    updateModernSaveStatus("saving");
  }
}

function addNewQuestion() {
  const newQuestion = {
    id: Date.now(),
    text: "",
    type: "mcq", // Default to multiple choice
    options: ["", "", "", ""],
    correctAnswer: 0,
    image: null,
  };

  currentExamData.questions.push(newQuestion);

  // Regenerate questions editor
  const questionsSection = document.getElementById("questionsSection");
  questionsSection.innerHTML = generateModernQuestionsEditor(
    currentExamData.questions
  );

  updateModernSaveStatus("saving");
  showNotification("تم إضافة سؤال جديد بالتصميم المتطور! ✨", "success");
}

function deleteQuestion(index) {
  if (currentExamData.questions.length <= 1) {
    showNotification("يجب أن يحتوي الاختبار على سؤال واحد على الأقل", "error");
    return;
  }

  if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
    currentExamData.questions.splice(index, 1);

    // Regenerate questions editor
    const questionsSection = document.getElementById("questionsSection");
    questionsSection.innerHTML = generateModernQuestionsEditor(
      currentExamData.questions
    );

    updateModernSaveStatus("saving");
    showNotification("تم حذف السؤال", "info");
  }
}

function duplicateQuestion(index) {
  const originalQuestion = currentExamData.questions[index];
  const duplicatedQuestion = {
    ...originalQuestion,
    id: Date.now(),
    text: originalQuestion.text + " (نسخة)",
  };

  currentExamData.questions.splice(index + 1, 0, duplicatedQuestion);

  // Regenerate questions editor
  const questionsSection = document.getElementById("questionsSection");
  questionsSection.innerHTML = generateModernQuestionsEditor(
    currentExamData.questions
  );

  updateModernSaveStatus("saving");
  showNotification("تم نسخ السؤال بنجاح! 📋", "success");
}

function moveQuestionUp(index) {
  if (index > 0) {
    const temp = currentExamData.questions[index];
    currentExamData.questions[index] = currentExamData.questions[index - 1];
    currentExamData.questions[index - 1] = temp;

    // Regenerate questions editor
    const questionsSection = document.getElementById("questionsSection");
    questionsSection.innerHTML = generateModernQuestionsEditor(
      currentExamData.questions
    );

    updateModernSaveStatus("saving");
  }
}

function moveQuestionDown(index) {
  if (index < currentExamData.questions.length - 1) {
    const temp = currentExamData.questions[index];
    currentExamData.questions[index] = currentExamData.questions[index + 1];
    currentExamData.questions[index + 1] = temp;

    // Regenerate questions editor
    const questionsSection = document.getElementById("questionsSection");
    questionsSection.innerHTML = generateModernQuestionsEditor(
      currentExamData.questions
    );

    updateModernSaveStatus("saving");
  }
}

function uploadQuestionImage(questionIndex) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification(
        "حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5MB",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      currentExamData.questions[questionIndex].image = event.target.result;

      // Regenerate questions editor
      const questionsSection = document.getElementById("questionsSection");
      questionsSection.innerHTML = generateModernQuestionsEditor(
        currentExamData.questions
      );

      updateModernSaveStatus("saving");
      showNotification("تم رفع الصورة بنجاح! 📸", "success");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function removeQuestionImage(questionIndex) {
  currentExamData.questions[questionIndex].image = null;

  // Regenerate questions editor
  const questionsSection = document.getElementById("questionsSection");
  questionsSection.innerHTML = generateModernQuestionsEditor(
    currentExamData.questions
  );

  updateModernSaveStatus("saving");
  showNotification("تم إزالة الصورة", "info");
}

function updateModernSaveStatus(status) {
  const saveStatus = document.getElementById("saveStatus");
  const saveIcon = document.getElementById("saveIcon");
  if (!saveStatus || !saveIcon) return;

  if (status === "saving") {
    saveStatus.className = "save-status-modern saving";
    saveIcon.className = "save-icon-modern saving";
    saveStatus.innerHTML = `
      <div class="save-icon-modern saving"></div>
      <span class="text-lg font-bold">جاري الحفظ التلقائي...</span>
    `;

    setTimeout(() => {
      updateModernSaveStatus("saved");
    }, 1500);
  } else if (status === "saved") {
    saveStatus.className = "save-status-modern saved";
    saveIcon.className = "save-icon-modern saved";
    saveStatus.innerHTML = `
      <div class="save-icon-modern saved"></div>
      <span class="text-lg font-bold">جميع التغييرات محفوظة تلقائياً ✅</span>
    `;
  }
}

// FIXED: Save as draft function with proper state management and attempt tracking
function saveExamAsDraft() {
  if (!isEditing || !editingExamId || examSaveInProgress) return;

  // FIXED: Prevent infinite save attempts
  if (saveAttempts >= 3) {
    showNotification(
      "تم تجاوز عدد المحاولات المسموح. يرجى إعادة تحميل الصفحة",
      "error"
    );
    return;
  }

  // FIXED: Use debounced save to prevent rapid saves
  const saveResult = debouncedSave(() => {
    examSaveInProgress = true; // FIXED: Set save in progress flag
    saveAttempts++; // FIXED: Increment save attempts

    // Get form data
    const title = document.getElementById("examTitle").value.trim();
    const description = document.getElementById("examDescription").value.trim();
    const duration = parseInt(document.getElementById("examDuration").value);

    // Get selected classes from checkboxes
    const selectedClasses = Array.from(
      document.querySelectorAll(".class-checkbox-input:checked")
    ).map((cb) => cb.value);

    // Get schedule data
    const scheduleCheckbox = document.getElementById("scheduleExam");
    const publishDate = document.getElementById("publishDate").value;
    const publishTime = document.getElementById("publishTime").value;

    // Validation
    if (!title || !duration || selectedClasses.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification(
        "يرجى ملء العنوان والمدة واختيار صف واحد على الأقل",
        "error"
      );
      return false;
    }

    if (currentExamData.questions.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("يرجى إضافة سؤال واحد على الأقل", "error");
      return false;
    }

    // Find and update exam
    const examIndex = exams.findIndex((e) => e.id === editingExamId);
    if (examIndex !== -1) {
      exams[examIndex] = {
        ...exams[examIndex],
        title: title,
        description: description || "اختبار في الرياضيات",
        duration: duration,
        classes: selectedClasses,
        questions: currentExamData.questions,
        publishDate: scheduleCheckbox.checked ? publishDate : null,
        publishTime: scheduleCheckbox.checked ? publishTime : null,
        isPublished: false, // Draft is not published
        status: "draft", // Set as draft
      };

      localStorage.setItem("exams", JSON.stringify(exams));

      // FIXED: Reset editing state properly
      isEditing = false;
      editingExamId = null;
      currentExamData = null;
      examSaveInProgress = false;
      saveAttempts = 0; // FIXED: Reset save attempts

      // Go back to admin panel
      showSection("adminPanel");
      showAdminTab("adminExams");

      loadExams(); // Refresh exams list

      showNotification("تم حفظ التعديلات بنجاح! 💾", "success");
      return true;
    } else {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("حدث خطأ في حفظ التعديلات", "error");
      return false;
    }
  });

  if (!saveResult) {
    showNotification("تم تجاهل المحاولة - حفظ سريع جداً", "warning");
  }
}

// FIXED: Save exam changes function with proper state management and attempt tracking
function saveExamChanges() {
  if (!isEditing || !editingExamId || examSaveInProgress) return;

  // FIXED: Prevent infinite save attempts
  if (saveAttempts >= 3) {
    showNotification(
      "تم تجاوز عدد المحاولات المسموح. يرجى إعادة تحميل الصفحة",
      "error"
    );
    return;
  }

  // FIXED: Use debounced save to prevent rapid saves
  const saveResult = debouncedSave(() => {
    examSaveInProgress = true; // FIXED: Set save in progress flag
    saveAttempts++; // FIXED: Increment save attempts

    // Get form data
    const title = document.getElementById("examTitle").value.trim();
    const description = document.getElementById("examDescription").value.trim();
    const duration = parseInt(document.getElementById("examDuration").value);

    // Get selected classes from checkboxes
    const selectedClasses = Array.from(
      document.querySelectorAll(".class-checkbox-input:checked")
    ).map((cb) => cb.value);

    // Get schedule data
    const scheduleCheckbox = document.getElementById("scheduleExam");
    const publishDate = document.getElementById("publishDate").value;
    const publishTime = document.getElementById("publishTime").value;

    // Validation
    if (!title || !duration || selectedClasses.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification(
        "يرجى ملء العنوان والمدة واختيار صف واحد على الأقل",
        "error"
      );
      return false;
    }

    if (currentExamData.questions.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("يرجى إضافة سؤال واحد على الأقل", "error");
      return false;
    }

    // Find and update exam
    const examIndex = exams.findIndex((e) => e.id === editingExamId);
    if (examIndex !== -1) {
      // Determine publication status
      let isPublished = true;
      if (scheduleCheckbox.checked && publishDate && publishTime) {
        const publishDateTime = new Date(`${publishDate}T${publishTime}`);
        const now = new Date();
        isPublished = now >= publishDateTime;
      }

      exams[examIndex] = {
        ...exams[examIndex],
        title: title,
        description: description || "اختبار في الرياضيات",
        duration: duration,
        classes: selectedClasses,
        questions: currentExamData.questions,
        publishDate: scheduleCheckbox.checked ? publishDate : null,
        publishTime: scheduleCheckbox.checked ? publishTime : null,
        isPublished: isPublished,
        status: "published", // Set as published
      };

      localStorage.setItem("exams", JSON.stringify(exams));

      // FIXED: Reset editing state properly
      isEditing = false;
      editingExamId = null;
      currentExamData = null;
      examSaveInProgress = false;
      saveAttempts = 0; // FIXED: Reset save attempts

      // Go back to admin panel
      showSection("adminPanel");
      showAdminTab("adminExams");

      loadExams(); // Refresh exams list

      const scheduleMessage =
        scheduleCheckbox.checked && !isPublished
          ? ` وتم جدولته للنشر في ${publishDate} الساعة ${publishTime}`
          : "";

      showNotification(
        `تم نشر الاختبار بنجاح! 🚀${scheduleMessage}`,
        "success"
      );
      return true;
    } else {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("حدث خطأ في نشر الاختبار", "error");
      return false;
    }
  });

  if (!saveResult) {
    showNotification("تم تجاهل المحاولة - حفظ سريع جداً", "warning");
  }
}

function cancelExamEdit() {
  if (
    confirm(
      "هل أنت متأكد من إلغاء التعديلات؟ ستفقد جميع التغييرات غير المحفوظة."
    )
  ) {
    // FIXED: Reset editing state properly
    isEditing = false;
    editingExamId = null;
    currentExamData = null;
    examSaveInProgress = false;
    saveAttempts = 0; // FIXED: Reset save attempts
    lastSaveTime = 0; // FIXED: Reset last save time

    // Go back to admin panel
    showSection("adminPanel");
    showAdminTab("adminExams");

    showNotification("تم إلغاء التعديل", "info");
  }
}

// FIXED: Save new exam as draft with proper state management and attempt tracking
function saveNewExamAsDraft() {
  if (examSaveInProgress) return;

  // FIXED: Prevent infinite save attempts
  if (saveAttempts >= 3) {
    showNotification(
      "تم تجاوز عدد المحاولات المسموح. يرجى إعادة تحميل الصفحة",
      "error"
    );
    return;
  }

  // FIXED: Use debounced save to prevent rapid saves
  const saveResult = debouncedSave(() => {
    examSaveInProgress = true; // FIXED: Set save in progress flag
    saveAttempts++; // FIXED: Increment save attempts

    // Get form data
    const title = document.getElementById("examTitle").value.trim();
    const description = document.getElementById("examDescription").value.trim();
    const duration = parseInt(document.getElementById("examDuration").value);

    // Get selected classes from checkboxes
    const selectedClasses = Array.from(
      document.querySelectorAll(".class-checkbox-input:checked")
    ).map((cb) => cb.value);

    // Get schedule data
    const scheduleCheckbox = document.getElementById("scheduleExam");
    const publishDate = document.getElementById("publishDate").value;
    const publishTime = document.getElementById("publishTime").value;

    // Validation
    if (!title || !duration || selectedClasses.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification(
        "يرجى ملء العنوان والمدة واختيار صف واحد على الأقل",
        "error"
      );
      return false;
    }

    if (currentExamData.questions.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("يرجى إضافة سؤال واحد على الأقل", "error");
      return false;
    }

    const newExam = {
      id: Date.now().toString(),
      title: title,
      description: description || "اختبار في الرياضيات",
      duration: duration,
      classes: selectedClasses,
      questions: currentExamData.questions,
      publishDate: scheduleCheckbox.checked ? publishDate : null,
      publishTime: scheduleCheckbox.checked ? publishTime : null,
      isPublished: false, // Draft is not published
      status: "draft", // Set as draft
    };

    exams.push(newExam);
    localStorage.setItem("exams", JSON.stringify(exams));

    // FIXED: Reset editing state properly
    isEditing = false;
    editingExamId = null;
    currentExamData = null;
    examSaveInProgress = false;
    saveAttempts = 0; // FIXED: Reset save attempts

    // Go back to admin panel
    showSection("adminPanel");
    showAdminTab("adminExams");

    loadExams(); // Refresh exams list

    showNotification("تم حفظ الاختبار كمسودة بنجاح! 💾", "success");
    return true;
  });

  if (!saveResult) {
    showNotification("تم تجاهل المحاولة - حفظ سريع جداً", "warning");
  }
}

// FIXED: Save new exam function with proper state management and attempt tracking
function saveNewExam() {
  if (examSaveInProgress) return;

  // FIXED: Prevent infinite save attempts
  if (saveAttempts >= 3) {
    showNotification(
      "تم تجاوز عدد المحاولات المسموح. يرجى إعادة تحميل الصفحة",
      "error"
    );
    return;
  }

  // FIXED: Use debounced save to prevent rapid saves
  const saveResult = debouncedSave(() => {
    examSaveInProgress = true; // FIXED: Set save in progress flag
    saveAttempts++; // FIXED: Increment save attempts

    // Get form data
    const title = document.getElementById("examTitle").value.trim();
    const description = document.getElementById("examDescription").value.trim();
    const duration = parseInt(document.getElementById("examDuration").value);

    // Get selected classes from checkboxes
    const selectedClasses = Array.from(
      document.querySelectorAll(".class-checkbox-input:checked")
    ).map((cb) => cb.value);

    // Get schedule data
    const scheduleCheckbox = document.getElementById("scheduleExam");
    const publishDate = document.getElementById("publishDate").value;
    const publishTime = document.getElementById("publishTime").value;

    // Validation
    if (!title || !duration || selectedClasses.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification(
        "يرجى ملء العنوان والمدة واختيار صف واحد على الأقل",
        "error"
      );
      return false;
    }

    if (currentExamData.questions.length === 0) {
      examSaveInProgress = false; // FIXED: Reset flag on error
      showNotification("يرجى إضافة سؤال واحد على الأقل", "error");
      return false;
    }

    // Determine publication status
    let isPublished = true;
    if (scheduleCheckbox.checked && publishDate && publishTime) {
      const publishDateTime = new Date(`${publishDate}T${publishTime}`);
      const now = new Date();
      isPublished = now >= publishDateTime;
    }

    const newExam = {
      id: Date.now().toString(),
      title: title,
      description: description || "اختبار في الرياضيات",
      duration: duration,
      classes: selectedClasses,
      questions: currentExamData.questions,
      publishDate: scheduleCheckbox.checked ? publishDate : null,
      publishTime: scheduleCheckbox.checked ? publishTime : null,
      isPublished: isPublished,
      status: "published", // Set as published
    };

    exams.push(newExam);
    localStorage.setItem("exams", JSON.stringify(exams));

    // FIXED: Reset editing state properly
    isEditing = false;
    editingExamId = null;
    currentExamData = null;
    examSaveInProgress = false;
    saveAttempts = 0; // FIXED: Reset save attempts

    // Go back to admin panel
    showSection("adminPanel");
    showAdminTab("adminExams");

    loadExams(); // Refresh exams list

    const scheduleMessage =
      scheduleCheckbox.checked && !isPublished
        ? ` وتم جدولته للنشر في ${publishDate} الساعة ${publishTime}`
        : "";

    showNotification(
      `تم إنشاء ونشر الاختبار بنجاح! 🚀${scheduleMessage}`,
      "success"
    );
    return true;
  });

  if (!saveResult) {
    showNotification("تم تجاهل المحاولة - حفظ سريع جداً", "warning");
  }
}

// New function to duplicate an exam
function duplicateExam(examId) {
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return;

  const newExam = {
    ...exam,
    id: Date.now().toString(),
    title: exam.title + " (نسخة)",
    isPublished: false, // New copy starts as unpublished
    status: "draft", // New copy starts as draft
    publishDate: null,
    publishTime: null,
    questions: exam.questions.map((q) => ({
      ...q,
      id: Date.now() + Math.random(),
    })),
  };

  exams.push(newExam);
  localStorage.setItem("exams", JSON.stringify(exams));

  loadAdminExams();
  loadExams();
  showNotification("تم نسخ الاختبار بنجاح!", "success");
}

function loadAdminWorksheets() {
  const container = document.getElementById("adminContent");

  const worksheetsHtml = `
    <div class="bg-blue-50 rounded-2xl p-8 mb-8">
      <h3 class="text-2xl font-bold gradient-text mb-6">📄 إدارة أوراق العمل</h3>
      <p class="text-blue-700 text-lg mb-6">
        هنا يمكنك إدارة أوراق العمل المرفوعة ومراقبة إحصائيات التحميل
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">${
            worksheets.length
          }</div>
          <div class="text-gray-600 mt-2">إجمالي أوراق العمل</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-600">${worksheets.reduce(
            (sum, w) => sum + w.downloadCount,
            0
          )}</div>
          <div class="text-gray-600 mt-2">إجمالي التحميلات</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">${Math.round(
            worksheets.reduce((sum, w) => sum + w.downloadCount, 0) /
              Math.max(worksheets.length, 1)
          )}</div>
          <div class="text-gray-600 mt-2">متوسط التحميل</div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        <thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <tr>
            <th class="py-4 px-6 text-right font-bold">عنوان ورقة العمل</th>
            <th class="py-4 px-6 text-right font-bold">الصف</th>
            <th class="py-4 px-6 text-right font-bold">تاريخ الرفع</th>
            <th class="py-4 px-6 text-right font-bold">مرات التحميل</th>
            <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${worksheets
            .map(
              (worksheet) => `
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="py-4 px-6 font-medium">${worksheet.title}</td>
                <td class="py-4 px-6">${getClassNameArabic(
                  worksheet.class
                )}</td>
                <td class="py-4 px-6">${worksheet.uploadDate}</td>
                <td class="py-4 px-6">
                  <span class="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">${
                    worksheet.downloadCount
                  }</span>
                </td>
                <td class="py-4 px-6">
                  <button onclick="deleteWorksheet(${
                    worksheet.id
                  })" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = worksheetsHtml;
}

function loadAdminWeeklyPlans() {
  const container = document.getElementById("adminContent");

  const plansHtml = `
    <div class="bg-green-50 rounded-2xl p-8 mb-8">
      <h3 class="text-2xl font-bold gradient-text mb-6">📅 إدارة الخطط الأسبوعية</h3>
      <p class="text-green-700 text-lg mb-6">
        هنا يمكنك إدارة الخطط الأسبوعية المرفوعة ومراقبة إحصائيات التحميل
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-600">${
            weeklyPlans.length
          }</div>
          <div class="text-gray-600 mt-2">إجمالي الخطط</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">${weeklyPlans.reduce(
            (sum, p) => sum + p.downloadCount,
            0
          )}</div>
          <div class="text-gray-600 mt-2">إجمالي التحميلات</div>
        </div>
        <div class="bg-white rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">${Math.round(
            weeklyPlans.reduce((sum, p) => sum + p.downloadCount, 0) /
              Math.max(weeklyPlans.length, 1)
          )}</div>
          <div class="text-gray-600 mt-2">متوسط التحميل</div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        <thead class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <tr>
            <th class="py-4 px-6 text-right font-bold">عنوان الخطة</th>
            <th class="py-4 px-6 text-right font-bold">الأسبوع</th>
            <th class="py-4 px-6 text-right font-bold">الصف</th>
            <th class="py-4 px-6 text-right font-bold">تاريخ الرفع</th>
            <th class="py-4 px-6 text-right font-bold">مرات التحميل</th>
            <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${weeklyPlans
            .map(
              (plan) => `
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="py-4 px-6 font-medium">${plan.title}</td>
                <td class="py-4 px-6">${getWeekNameArabic(plan.week)}</td>
                <td class="py-4 px-6">${getClassNameArabic(plan.class)}</td>
                <td class="py-4 px-6">${plan.uploadDate}</td>
                <td class="py-4 px-6">
                  <span class="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">${
                    plan.downloadCount
                  }</span>
                </td>
                <td class="py-4 px-6">
                  <button onclick="deleteWeeklyPlan(${
                    plan.id
                  })" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = plansHtml;
}

function deleteWorksheet(id) {
  if (confirm("هل أنت متأكد من حذف ورقة العمل هذه؟")) {
    worksheets = worksheets.filter((w) => w.id !== id);
    localStorage.setItem("worksheets", JSON.stringify(worksheets));
    loadAdminWorksheets();
    loadWorksheets();
    showNotification("تم حذف ورقة العمل بنجاح");
  }
}

function deleteWeeklyPlan(id) {
  if (confirm("هل أنت متأكد من حذف الخطة الأسبوعية هذه؟")) {
    weeklyPlans = weeklyPlans.filter((p) => p.id !== id);
    localStorage.setItem("weeklyPlans", JSON.stringify(weeklyPlans));
    loadAdminWeeklyPlans();
    loadWeeklyPlans();
    showNotification("تم حذف الخطة الأسبوعية بنجاح");
  }
}

// Global variables
let currentWeek = "week1";

// Initialize the students section
function initializeStudents() {
  showClassStudents("class5A");
  showWeekStudents("week1");
}

// Show students for a specific class
function showClassStudents(className) {
  // ENHANCED: للطلاب - منع تغيير الصف
  if (
    !isAdmin &&
    currentUser &&
    currentUser.class &&
    className !== currentUser.class
  ) {
    showNotification("يمكنك مشاهدة طلاب صفك فقط", "info");
    className = currentUser.class;
  }

  currentClass = className;

  // Update class tabs
  document.querySelectorAll(".class-tab").forEach((tab) => {
    if (tab.dataset.class === className) {
      tab.className =
        "class-tab bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg transform scale-105";
    } else {
      tab.className =
        "class-tab bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-300 transform hover:scale-105";
    }
  });

  loadStudentsForCurrentSelection();
}

// Show students for a specific week
function showWeekStudents(weekName) {
  currentWeek = weekName;

  // Update week tabs
  document.querySelectorAll(".week-tab").forEach((tab) => {
    if (tab.dataset.week === weekName) {
      tab.className =
        "week-tab bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg transform scale-105";
    } else {
      tab.className =
        "week-tab bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-300 transform hover:scale-105";
    }
  });

  loadStudentsForCurrentSelection();
}

// Load students based on current class and week selection
function loadStudentsForCurrentSelection() {
  const container = document.getElementById("studentsContainer");
  const weekStudents = students[currentWeek] || [];

  // ENHANCED: تطبيق فلترة ذكية
  let filteredStudents = weekStudents;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض طلاب فصلهم فقط
    filteredStudents = weekStudents.filter(
      (student) => student.class === currentUser.class
    );
  } else {
    // للمعلم - عرض الصف المختار
    filteredStudents = weekStudents.filter(
      (student) => student.class === currentClass
    );
  }

  if (filteredStudents.length === 0) {
    const noStudentsMessage =
      !isAdmin && currentUser
        ? `لا توجد طلاب متميزون من صف ${getClassNameArabic(
            currentUser.class
          )} في هذا الأسبوع`
        : "لا توجد طلاب متميزون";

    container.innerHTML = `
      <div class="text-center py-16">
        <div class="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
          <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-600 mb-3">${noStudentsMessage}</h3>
        <p class="text-gray-500 text-lg">لم يتم إضافة طلاب لهذا الصف في هذا الأسبوع بعد</p>
      </div>
    `;
    return;
  }

  const studentsHtml = `
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-800">
          ${getClassNameArabic(currentClass)} - ${getWeekNameArabic(
    currentWeek
  )}
        </h3>
        <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
          ${filteredStudents.length} عدد الطلاب:
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        ${filteredStudents
          .map(
            (student) => `
          <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-blue-100 overflow-hidden group">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <!-- صورة المستخدم -->
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </div>
                <!-- نجمة التميز -->
                <div class="flex">
                  <svg class="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>
              <h4 class="text-xl font-bold mb-2">${student.name}</h4>
              <div class="flex items-center text-blue-100">
                <span class="text-sm font-medium">${getClassNameArabic(
                  student.class
                )}</span>
              </div>
            </div>
            
            <div class="p-6">
              ${
                student.quote
                  ? `<div class="mb-4">
                      <p class="text-gray-700 leading-relaxed">«${student.quote}»</p>
                    </div>`
                  : ""
              }  
              <div class="flex flex-wrap gap-2">
              ${student.tags
                .map(
                  (tag) => `
                <span class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                  ${tag}
                </span>
              `
                )
                .join("")}
            </div>
            
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm text-gray-600">
                <span>${getWeekNameArabic(currentWeek)}</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                  متميز
                </span>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  container.innerHTML = studentsHtml;
}

// Enhanced admin functions
function loadAdminStudents() {
  const container = document.getElementById("adminContent");

  const studentsHtml = `
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
      <button onclick="showAddStudentForm()" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg text-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        إضافة طالب متميز
      </button>
    </div>
        
    <div id="addStudentForm" class="bg-white border-2 border-blue-100 rounded-2xl p-8 mb-8 hidden shadow-lg">
      <h3 class="text-3xl font-bold text-gray-800 mb-8 flex items-center">
        <svg class="w-8 h-8 text-blue-600 ml-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        إضافة طالب متميز
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div>
            <label class="block text-gray-800 mb-3 font-semibold text-lg" for="studentName">اسم الطالب</label>
            <input type="text" id="studentNameInput" class="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg" placeholder="أدخل اسم الطالب الكامل">
          </div>
          <div>
            <label class="block text-gray-800 mb-3 font-semibold text-lg" for="studentQuote">العبارة التحفيزية</label>
            <input type="text" id="studentQuoteInput" class="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg" placeholder="اكتب عبارة تحفيزية">
          </div>
        </div>
        <div class="space-y-6">
          <div>
            <label class="block text-gray-800 mb-3 font-semibold text-lg" for="studentClass">الصف</label>
            <select id="studentClassInput" class="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg bg-white">
              <option value="class5A">الخامس أ</option>
              <option value="class6D">السادس د</option>
              <option value="class6H">السادس هـ</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-800 mb-3 font-semibold text-lg" for="studentWeek">الأسبوع</label>
            <select id="studentWeekInput" class="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg bg-white">
              <option value="week1">الأسبوع الأول</option>
              <option value="week2">الأسبوع الثاني</option>
              <option value="week3">الأسبوع الثالث</option>
            </select>
          </div>
        </div>
        <div class="lg:col-span-2">
          <label class="block text-gray-800 mb-3 font-semibold text-lg" for="studentTags">الوسوم (مفصولة بفواصل)</label>
          <input type="text" id="studentTagsInput" placeholder="مثال: الرياضيات، متفوق، مبدع" class="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg">
        </div>
      </div>
      
      <div class="flex justify-end space-x-4 space-x-reverse mt-8">
        <button onclick="hideAddStudentForm()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl font-semibold transition-all duration-300 text-lg">إلغاء</button>
        <button onclick="saveStudent()" class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">حفظ الطالب</button>
      </div>
    </div>
        
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h3 class="text-2xl font-bold text-white flex items-center">
          <svg class="w-6 h-6 ml-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          قائمة الطلاب المتميزين
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-right font-bold text-gray-800 border-b">اسم الطالب</th>
              <th class="py-4 px-6 text-right font-bold text-gray-800 border-b">الصف</th>
              <th class="py-4 px-6 text-right font-bold text-gray-800 border-b">الأسبوع</th>
              <th class="py-4 px-6 text-right font-bold text-gray-800 border-b">الوسوم</th>
              <th class="py-4 px-6 text-right font-bold text-gray-800 border-b">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${Object.keys(students)
              .map((weekName) =>
                students[weekName]
                  .map(
                    (student) => `
                    <tr class="hover:bg-blue-50 transition-colors duration-200">
                      <td class="py-6 px-6 font-semibold text-gray-900">${
                        student.name
                      }</td>
                      <td class="py-6 px-6 text-gray-700">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          ${getClassNameArabic(student.class)}
                        </span>
                      </td>
                      <td class="py-6 px-6 text-gray-700">
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          ${getWeekNameArabic(weekName)}
                        </span>
                      </td>
                      <td class="py-6 px-6">
                        <div class="flex flex-wrap gap-1">
                          ${student.tags
                            .map(
                              (tag) =>
                                `<span class="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">${tag}</span>`
                            )
                            .join("")}
                        </div>
                      </td>
                      <td class="py-6 px-6">
                        <button onclick="deleteStudent('${weekName}', ${
                      student.id
                    })" class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  `
                  )
                  .join("")
              )
              .flat()
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = studentsHtml;
}

// Helper functions
function getClassNameArabic(className) {
  const classNames = {
    class5A: "الخامس أ",
    class6D: "السادس د",
    class6H: "السادس هـ",
  };
  return classNames[className] || className;
}

function getWeekNameArabic(weekName) {
  const weekNames = {
    week1: "الأسبوع الأول",
    week2: "الأسبوع الثاني",
    week3: "الأسبوع الثالث",
  };
  return weekNames[weekName] || weekName;
}

// Print and share functions (keeping original functionality)
function printStudentsList() {
  window.print();
}

function shareStudentsList(platform) {
  const studentsText = Object.keys(students)
    .map((week) =>
      students[week]
        .map(
          (student) =>
            `${student.name} - ${getClassNameArabic(
              student.class
            )} - ${getWeekNameArabic(week)}`
        )
        .join("\n")
    )
    .join("\n\n");

  if (platform === "whatsapp") {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        "🌟 الطلاب المتميزون:\n\n" + studentsText
      )}`
    );
  } else if (platform === "email") {
    window.location.href = `mailto:?subject=قائمة الطلاب المتميزين&body=${encodeURIComponent(
      studentsText
    )}`;
  }
}

function exportStudentsList() {
  const studentsData = JSON.stringify(students, null, 2);
  const blob = new Blob([studentsData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students-list.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Admin functions (keeping original functionality)
function showAddStudentForm() {
  document.getElementById("addStudentForm").classList.remove("hidden");
}

function hideAddStudentForm() {
  document.getElementById("addStudentForm").classList.add("hidden");
}

function saveStudent() {
  const name = document.getElementById("studentNameInput").value;
  const quote = document.getElementById("studentQuoteInput").value;
  const className = document.getElementById("studentClassInput").value;
  const week = document.getElementById("studentWeekInput").value;
  const tags = document
    .getElementById("studentTagsInput")
    .value.split(",")
    .map((tag) => tag.trim());

  if (!name || !quote) {
    alert("يرجى ملء جميع الحقول المطلوبة");
    return;
  }

  const newStudent = {
    id: Date.now(),
    name,
    quote,
    class: className,
    tags,
  };

  if (!students[week]) {
    students[week] = [];
  }

  students[week].push(newStudent);

  // Clear form
  document.getElementById("studentNameInput").value = "";
  document.getElementById("studentQuoteInput").value = "";
  document.getElementById("studentTagsInput").value = "";

  hideAddStudentForm();
  loadAdminStudents();
}

function deleteStudent(week, studentId) {
  if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
    students[week] = students[week].filter(
      (student) => student.id !== studentId
    );
    loadAdminStudents();
  }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("studentsContainer")) {
    initializeStudents();
  }
});

function loadAdminReminders() {
  const container = document.getElementById("adminContent");

  const remindersHtml = `
        <button onclick="showAddReminderForm()" class="mb-8 success-gradient hover:shadow-2xl text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center interactive-button text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            🔔 إضافة تذكير جديد
        </button>
        
        <div id="addReminderForm" class="bg-blue-50 rounded-2xl p-8 mb-8 hidden">
            <h3 class="text-2xl font-bold gradient-text mb-6">🔔 إضافة تذكير جديد</h3>
            <div class="space-y-6">
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="reminderTitle">عنوان التذكير</label>
                    <input type="text" id="reminderTitleInput" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                </div>
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="reminderContent">محتوى التذكير</label>
                    <textarea id="reminderContentInput" rows="4" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="reminderType">نوع التذكير</label>
                    <select id="reminderTypeInput" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                        <option value="new">🔔 جديد</option>
                        <option value="important">⚠️ مهم</option>
                        <option value="urgent">🚨 عاجل</option>
                    </select>
                </div>
                
                <div class="flex justify-end space-x-4 space-x-reverse">
                    <button onclick="hideAddReminderForm()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium transition-all duration-300">❌ إلغاء</button>
                    <button onclick="saveReminder()" class="success-gradient hover:shadow-xl text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">💾 حفظ التذكير</button>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
                <thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                        <th class="py-4 px-6 text-right font-bold">عنوان التذكير</th>
                        <th class="py-4 px-6 text-right font-bold">النوع</th>
                        <th class="py-4 px-6 text-right font-bold">التاريخ</th>
                        <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${reminders
                      .map(
                        (reminder) => `
                        <tr class="hover:bg-gray-50 transition-colors duration-200">
                            <td class="py-4 px-6 font-medium">${
                              reminder.title
                            }</td>
                            <td class="py-4 px-6">
                                <span class="bg-${
                                  reminder.type === "new"
                                    ? "blue"
                                    : reminder.type === "important"
                                    ? "green"
                                    : "red"
                                }-100 text-${
                          reminder.type === "new"
                            ? "blue"
                            : reminder.type === "important"
                            ? "green"
                            : "red"
                        }-800 font-medium px-3 py-1 rounded-full">${
                          reminder.type === "new"
                            ? "🔔 جديد"
                            : reminder.type === "important"
                            ? "⚠️ مهم"
                            : "🚨 عاجل"
                        }</span>
                            </td>
                            <td class="py-4 px-6">${reminder.date}</td>
                            <td class="py-4 px-6">
                                <div class="flex space-x-2 space-x-reverse">
                                    <button onclick="deleteReminder(${
                                      reminder.id
                                    })" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = studentsHtml;
}

function loadAdminCodes() {
  const codesHtml = `
        <button onclick="showAddCodeForm()" class="mb-8 success-gradient hover:shadow-2xl text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center interactive-button text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            🔐 إضافة كود طالب جديد
        </button>
        
        <div id="addCodeForm" class="bg-blue-50 rounded-2xl p-8 mb-8 hidden">
            <h3 class="text-2xl font-bold gradient-text mb-6">🔐 إضافة كود طالب جديد</h3>
            <div class="space-y-6">
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="newStudentName">اسم الطالب</label>
                    <input type="text" id="newStudentNameInput" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                </div>
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="newStudentClass">الصف</label>
                    <select id="newStudentClassInput" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                        <option value="class5A">الخامس أ</option>
                        <option value="class6D">السادس د</option>
                        <option value="class6H">السادس هـ</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 mb-3 font-medium" for="newStudentCode">كود الطالب</label>
                    <input type="text" id="newStudentCodeInput" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                </div>
                
                <div class="flex justify-end space-x-4 space-x-reverse">
                    <button onclick="hideAddCodeForm()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium transition-all duration-300">❌ إلغاء</button>
                    <button onclick="saveStudentCode()" class="success-gradient hover:shadow-xl text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">💾 حفظ الكود</button>
                </div>
            </div>
        </div>
        
        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
            <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 ml-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                    <h3 class="text-lg font-bold text-yellow-800">⚠️ ملاحظة مهمة</h3>
                    <div class="mt-3 text-yellow-700">
                        <p class="leading-relaxed">هذه الأكواد تُستخدم لتسجيل دخول الطلاب وأيضاً كأكواد متابعة لأولياء الأمور. تأكد من إعطاء كل طالب كوده الخاص وعدم مشاركته مع الآخرين للحفاظ على الخصوصية والأمان.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white rounded-2xl overflow-hidden shadow-xl">
                <thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                        <th class="py-4 px-6 text-right font-bold">اسم الطالب</th>
                        <th class="py-4 px-6 text-right font-bold">الصف</th>
                        <th class="py-4 px-6 text-right font-bold">الكود</th>
                        <th class="py-4 px-6 text-right font-bold">الإجراءات</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${Object.keys(studentCodes)
                      .map(
                        (studentName) => `
                        <tr class="hover:bg-gray-50 transition-colors duration-200">
                            <td class="py-4 px-6 font-bold text-lg">${studentName}</td>
                            <td class="py-4 px-6">${getClassNameArabic(
                              studentCodes[studentName].class
                            )}</td>
                            <td class="py-4 px-6">
                                <span class="bg-blue-100 text-blue-800 font-mono font-bold px-4 py-2 rounded-full">${
                                  studentCodes[studentName].code
                                }</span>
                            </td>
                            <td class="py-4 px-6">
                                <div class="flex space-x-2 space-x-reverse">
                                    <button onclick="deleteStudentCode('${studentName}')" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = codesHtml;
}

// Admin form functions
function showAddStudentForm() {
  document.getElementById("addStudentForm").classList.remove("hidden");
}

function hideAddStudentForm() {
  document.getElementById("addStudentForm").classList.add("hidden");
  // Clear form
  document.getElementById("studentNameInput").value = "";
  document.getElementById("studentQuoteInput").value = "";
  document.getElementById("studentClassInput").value = "class5A";
  document.getElementById("studentWeekInput").value = "week1";
  document.getElementById("studentTagsInput").value = "";
}

function showAddReminderForm() {
  document.getElementById("addReminderForm").classList.remove("hidden");
}

function hideAddReminderForm() {
  document.getElementById("addReminderForm").classList.add("hidden");
  // Clear form
  document.getElementById("reminderTitleInput").value = "";
  document.getElementById("reminderContentInput").value = "";
  document.getElementById("reminderTypeInput").value = "new";
}

function showAddCodeForm() {
  document.getElementById("addCodeForm").classList.remove("hidden");
}

function hideAddCodeForm() {
  document.getElementById("addCodeForm").classList.add("hidden");
  // Clear form
  document.getElementById("newStudentNameInput").value = "";
  document.getElementById("newStudentClassInput").value = "class5A";
  document.getElementById("newStudentCodeInput").value = "";
}

// Save functions with enhanced validation
function saveStudent() {
  const name = document.getElementById("studentNameInput").value;
  const quote = document.getElementById("studentQuoteInput").value;
  const className = document.getElementById("studentClassInput").value;
  const weekName = document.getElementById("studentWeekInput").value;
  const tags = document
    .getElementById("studentTagsInput")
    .value.split("،")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  if (!name || !quote) {
    showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  const newStudent = {
    id: Date.now(),
    name: name,
    quote: quote,
    class: className,
    tags: tags.length > 0 ? tags : ["الرياضيات", "متفوق"],
  };

  if (!students[weekName]) {
    students[weekName] = [];
  }

  students[weekName].push(newStudent);
  localStorage.setItem("students", JSON.stringify(students));

  hideAddStudentForm();
  loadAdminStudents();
  loadStudents();
  showNotification("تم إضافة الطالب المتميز بنجاح!");
}

function saveReminder() {
  const title = document.getElementById("reminderTitleInput").value;
  const content = document.getElementById("reminderContentInput").value;
  const type = document.getElementById("reminderTypeInput").value;

  if (!title || !content) {
    showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  const newReminder = {
    id: Date.now(),
    title: title,
    content: content,
    type: type,
    classes: ["class5A", "class6D", "class6H"], // All classes by default
    date: new Date().toLocaleDateString("ar-SA"),
  };

  reminders.unshift(newReminder);
  localStorage.setItem("reminders", JSON.stringify(reminders));

  hideAddReminderForm();
  loadAdminReminders();
  loadReminders();
  loadLatestReminders();
  showNotification("تم إضافة التذكير بنجاح!");
}

function saveStudentCode() {
  const name = document.getElementById("newStudentNameInput").value;
  const studentClass = document.getElementById("newStudentClassInput").value;
  const code = document.getElementById("newStudentCodeInput").value;

  if (!name || !code || !studentClass) {
    showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  if (studentCodes[name]) {
    showNotification("هذا الطالب موجود بالفعل", "error");
    return;
  }

  studentCodes[name] = { code: code, class: studentClass };
  localStorage.setItem("studentCodes", JSON.stringify(studentCodes));

  hideAddCodeForm();
  loadAdminCodes();
  loadTeacherStudentOptions(); // Update teacher dropdown
  showNotification("تم إضافة كود الطالب بنجاح!");
}

// Enhanced Delete functions
function deleteExam(examId) {
  if (
    confirm(
      "هل أنت متأكد من حذف هذا الاختبار؟ هذا الإجراء لا يمكن التراجع عنه."
    )
  ) {
    exams = exams.filter((exam) => exam.id !== examId);
    localStorage.setItem("exams", JSON.stringify(exams));
    loadAdminExams();
    loadExams();
    showNotification("تم حذف الاختبار بنجاح");
  }
}

function deleteStudent(weekName, studentId) {
  if (confirm("هل أنت متأكد من حذف هذا الطالب من قائمة المتميزين؟")) {
    students[weekName] = students[weekName].filter(
      (student) => student.id !== studentId
    );
    localStorage.setItem("students", JSON.stringify(students));
    loadAdminStudents();
    loadStudents();
    showNotification("تم حذف الطالب من قائمة المتميزين");
  }
}

function deleteReminder(reminderId) {
  if (confirm("هل أنت متأكد من حذف هذا التذكير؟")) {
    reminders = reminders.filter((reminder) => reminder.id !== reminderId);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    loadAdminReminders();
    loadReminders();
    loadLatestReminders();
    showNotification("تم حذف التذكير بنجاح");
  }
}

function deleteStudentCode(studentName) {
  if (confirm(`هل أنت متأكد من حذف كود الطالب "${studentName}"؟`)) {
    delete studentCodes[studentName];
    localStorage.setItem("studentCodes", JSON.stringify(studentCodes));
    loadAdminCodes();
    loadTeacherStudentOptions(); // Update teacher dropdown
    showNotification("تم حذف كود الطالب بنجاح");
  }
}

// Initialize admin panel when section is shown
document.addEventListener("click", function (e) {
  if (
    e.target.getAttribute("onclick") === "showSection('adminPanel')" &&
    isAdmin
  ) {
    setTimeout(() => {
      showAdminTab("adminExams");
    }, 100);
  }
});

// ENHANCED: تحسين وظائف أوراق العمل مع فلترة ذكية
function loadWorksheets() {
  const container = document.getElementById("worksheetsList");
  container.innerHTML = "";

  // ENHANCED: تطبيق فلترة ذكية لأوراق العمل
  let filteredWorksheets = worksheets;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض أوراق عمل فصلهم فقط
    filteredWorksheets = worksheets.filter(
      (worksheet) => worksheet.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    // للمعلم - عرض الصف المختار
    filteredWorksheets = worksheets.filter(
      (worksheet) => worksheet.class === currentClass
    );
  }

  if (filteredWorksheets.length === 0) {
    const noWorksheetsMessage =
      !isAdmin && currentUser
        ? `لا توجد أوراق عمل متاحة لصف ${getClassNameArabic(
            currentUser.class
          )} حالياً`
        : "لا توجد أوراق عمل متاحة حالياً";

    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">${noWorksheetsMessage}</h3>
        <p class="text-gray-500 text-lg">سيتم إضافة أوراق العمل قريباً من قبل المعلم</p>
      </div>
    `;
    return;
  }

  filteredWorksheets.forEach((worksheet) => {
    const classNameArabic = getClassNameArabic(worksheet.class);

    const worksheetHtml = `
      <div class="pdf-item">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-xl font-bold text-gray-800">${worksheet.title}</h3>
          </div>
          <div class="text-gray-600 mb-3">
            <p><strong>الصف:</strong> ${classNameArabic}</p>
            <p><strong>تاريخ الرفع:</strong> ${worksheet.uploadDate}</p>
            <p><strong>مرات التحميل:</strong> ${worksheet.downloadCount}</p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            onclick="downloadWorksheet(${worksheet.id})"
            class="btn-primary py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            تحميل
          </button>
          <button
            onclick="printWorksheet(${worksheet.id})"
            class="btn-secondary py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة
          </button>
          <button
            onclick="shareWorksheet(${worksheet.id}, 'whatsapp')"
            class="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            واتساب
          </button>
        </div>
      </div>
    `;

    container.innerHTML += worksheetHtml;
  });
}

function handleWorksheetUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    showNotification("يرجى اختيار ملف PDF فقط", "error");
    input.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showNotification(
      "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 10MB",
      "error"
    );
    input.value = "";
    return;
  }

  // Store file data
  const reader = new FileReader();
  reader.onload = function (e) {
    // Store the file data for later use
    input.fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      data: e.target.result,
    };
    showNotification(
      "تم اختيار الملف بنجاح! اضغط على 'رفع ورقة العمل' للمتابعة",
      "success"
    );
  };
  reader.readAsDataURL(file);
}

function uploadWorksheet() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const title = document.getElementById("worksheetTitle").value.trim();
  const worksheetClass = document.getElementById("worksheetClass").value;
  const fileInput = document.getElementById("worksheetFile");

  if (!title || !worksheetClass || !fileInput.files[0]) {
    showNotification("يرجى ملء جميع الحقول واختيار ملف", "error");
    return;
  }

  const file = fileInput.files[0];
  const newWorksheet = {
    id: Date.now(),
    title: title,
    class: worksheetClass,
    fileName: file.name,
    fileData: fileInput.fileData, // Store the actual file data
    uploadDate: new Date().toLocaleDateString("ar-SA"),
    downloadCount: 0,
  };

  worksheets.unshift(newWorksheet);
  localStorage.setItem("worksheets", JSON.stringify(worksheets));

  // Clear form
  document.getElementById("worksheetTitle").value = "";
  document.getElementById("worksheetClass").value = "";
  document.getElementById("worksheetFile").value = "";

  loadWorksheets();
  showNotification("تم رفع ورقة العمل بنجاح!", "success");
}

function downloadWorksheet(id) {
  const worksheet = worksheets.find((w) => w.id === id);
  if (!worksheet) return;

  // Increment download count
  worksheet.downloadCount++;
  localStorage.setItem("worksheets", JSON.stringify(worksheets));

  // If file data exists, create a download link
  if (worksheet.fileData && worksheet.fileData.data) {
    const link = document.createElement("a");
    link.href = worksheet.fileData.data;
    link.download = worksheet.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`تم تحميل ${worksheet.title}`, "success");
  } else {
    // Simulate download for existing worksheets without file data
    showNotification(`تم تحميل ${worksheet.title}`, "success");
  }

  // Reload to update count
  loadWorksheets();
}

function printWorksheet(id) {
  const worksheet = worksheets.find((w) => w.id === id);
  if (!worksheet) return;

  showNotification(`جاري إعداد ${worksheet.title} للطباعة...`, "info");

  // Simulate print dialog
  setTimeout(() => {
    window.print();
  }, 1000);
}

function shareWorksheet(id, platform) {
  const worksheet = worksheets.find((w) => w.id === id);
  if (!worksheet) return;

  const shareText = `📚 ${worksheet.title}\n\nمن موقع الأستاذ علي العيسني للرياضيات\n\n🎯 ورقة عمل تعليمية مفيدة للطلاب\n📅 ${worksheet.uploadDate}`;

  if (platform === "whatsapp") {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
    showNotification("تم فتح واتساب للمشاركة!", "success");
  }
}

// ENHANCED: تحسين وظائف الخطط الأسبوعية مع فلترة ذكية
function loadWeeklyPlans() {
  const container = document.getElementById("weeklyPlansList");
  container.innerHTML = "";

  // ENHANCED: تطبيق فلترة ذكية للخطط الأسبوعية
  let filteredPlans = weeklyPlans;

  if (!isAdmin && currentUser && currentUser.class) {
    // للطلاب - عرض خطط فصلهم فقط
    filteredPlans = weeklyPlans.filter(
      (plan) => plan.class === currentUser.class
    );
  } else if (isAdmin && currentClass !== "all") {
    // للمعلم - عرض الصف المختار
    filteredPlans = weeklyPlans.filter((plan) => plan.class === currentClass);
  }

  if (filteredPlans.length === 0) {
    const noPlansMessage =
      !isAdmin && currentUser
        ? `لا توجد خطط أسبوعية متاحة لصف ${getClassNameArabic(
            currentUser.class
          )} حالياً`
        : "لا توجد خطط أسبوعية متاحة حالياً";

    container.innerHTML = `
      <div class="text-center py-12">
        <div class="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">${noPlansMessage}</h3>
        <p class="text-gray-500 text-lg">سيتم إضافة الخطط الأسبوعية قريباً من قبل المعلم</p>
      </div>
    `;
    return;
  }

  // Group plans by week
  const plansByWeek = {};
  filteredPlans.forEach((plan) => {
    if (!plansByWeek[plan.week]) {
      plansByWeek[plan.week] = [];
    }
    plansByWeek[plan.week].push(plan);
  });

  Object.keys(plansByWeek)
    .sort()
    .forEach((week) => {
      const weekNameArabic = getWeekNameArabic(week);

      container.innerHTML += `
      <div class="bg-green-50 rounded-2xl p-6 mb-6">
        <h3 class="text-2xl font-bold text-green-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          ${weekNameArabic}
        </h3>
        <div class="space-y-4">
          ${plansByWeek[week]
            .map((plan) => {
              const classNameArabic = getClassNameArabic(plan.class);
              return `
              <div class="pdf-item">
                <div class="flex-1">
                  <div class="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 class="text-xl font-bold text-gray-800">${plan.title}</h4>
                  </div>
                  <div class="text-gray-600 mb-3">
                    <p><strong>الصف:</strong> ${classNameArabic}</p>
                    <p><strong>تاريخ الرفع:</strong> ${plan.uploadDate}</p>
                    <p><strong>مرات التحميل:</strong> ${plan.downloadCount}</p>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                  <button
                    onclick="downloadWeeklyPlan(${plan.id})"
                    class="btn-primary py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    تحميل
                  </button>
                  <button
                    onclick="printWeeklyPlan(${plan.id})"
                    class="btn-secondary py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    طباعة
                  </button>
                  <button
                    onclick="shareWeeklyPlan(${plan.id}, 'whatsapp')"
                    class="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    واتساب
                  </button>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
    });
}

function handlePlanUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    showNotification("يرجى اختيار ملف PDF فقط", "error");
    input.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showNotification(
      "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 10MB",
      "error"
    );
    input.value = "";
    return;
  }

  // Store file data
  const reader = new FileReader();
  reader.onload = function (e) {
    input.fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      data: e.target.result,
    };
    showNotification(
      "تم اختيار الملف بنجاح! اضغط على 'رفع الخطة الأسبوعية' للمتابعة",
      "success"
    );
  };
  reader.readAsDataURL(file);
}

function uploadWeeklyPlan() {
  if (!isAdmin) {
    showNotification("هذه الميزة متاحة للمعلم فقط", "error");
    return;
  }

  const title = document.getElementById("planTitle").value.trim();
  const week = document.getElementById("planWeek").value;
  const planClass = document.getElementById("planClass").value;
  const fileInput = document.getElementById("planFile");

  if (!title || !week || !planClass || !fileInput.files[0]) {
    showNotification("يرجى ملء جميع الحقول واختيار ملف", "error");
    return;
  }

  const file = fileInput.files[0];
  const newPlan = {
    id: Date.now(),
    title: title,
    week: week,
    class: planClass,
    fileName: file.name,
    fileData: fileInput.fileData, // Store the actual file data
    uploadDate: new Date().toLocaleDateString("ar-SA"),
    downloadCount: 0,
  };

  weeklyPlans.unshift(newPlan);
  localStorage.setItem("weeklyPlans", JSON.stringify(weeklyPlans));

  // Clear form
  document.getElementById("planTitle").value = "";
  document.getElementById("planWeek").value = "";
  document.getElementById("planClass").value = "";
  document.getElementById("planFile").value = "";

  loadWeeklyPlans();
  showNotification("تم رفع الخطة الأسبوعية بنجاح!", "success");
}

function downloadWeeklyPlan(id) {
  const plan = weeklyPlans.find((p) => p.id === id);
  if (!plan) return;

  // Increment download count
  plan.downloadCount++;
  localStorage.setItem("weeklyPlans", JSON.stringify(weeklyPlans));

  // If file data exists, create a download link
  if (plan.fileData && plan.fileData.data) {
    const link = document.createElement("a");
    link.href = plan.fileData.data;
    link.download = plan.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`تم تحميل ${plan.title}`, "success");
  } else {
    // Simulate download for existing plans without file data
    showNotification(`تم تحميل ${plan.title}`, "success");
  }

  // Reload to update count
  loadWeeklyPlans();
}

function printWeeklyPlan(id) {
  const plan = weeklyPlans.find((p) => p.id === id);
  if (!plan) return;

  showNotification(`جاري إعداد ${plan.title} للطباعة...`, "info");

  setTimeout(() => {
    window.print();
  }, 1000);
}

function shareWeeklyPlan(id, platform) {
  const plan = weeklyPlans.find((p) => p.id === id);
  if (!plan) return;

  const shareText = `📅 ${plan.title}\n\nمن موقع الأستاذ علي العيسني للرياضيات\n\n🎯 خطة أسبوعية شاملة للطلاب\n📅 ${plan.uploadDate}`;

  if (platform === "whatsapp") {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
    showNotification("تم فتح واتساب للمشاركة!", "success");
  }
}

function getWeekNameArabic(week) {
  const weekNames = {
    week1: "الأسبوع الأول",
    week2: "الأسبوع الثاني",
    week3: "الأسبوع الثالث",
    week4: "الأسبوع الرابع",
    week5: "الأسبوع الخامس",
    week6: "الأسبوع السادس",
    week7: "الأسبوع السابع",
    week8: "الأسبوع الثامن",
  };
  return weekNames[week] || week;
}

// Enhanced Student Tracking Functions with Professional Design for Parents
function accessStudentTracking() {
  const code = document.getElementById("studentTrackingCode").value.trim();

  if (!code) {
    showNotification("يرجى إدخال كود الطالب", "error");
    return;
  }

  const studentName = findStudentByTrackingCode(code);

  if (studentName) {
    loadEnhancedStudentProgressForParents(studentName);
    document.getElementById("studentCodeAccess").classList.add("hidden");
    document
      .getElementById("studentProgressContent")
      .classList.remove("hidden");
    showNotification(`تم تحميل سجل الطالب: ${studentName}`, "success");
  } else {
    showNotification(
      "كود غير صحيح. يرجى التحقق من الكود والمحاولة مرة أخرى",
      "error"
    );
  }
}

function findStudentByTrackingCode(code) {
  for (const [studentName, studentData] of Object.entries(studentCodes)) {
    if (studentData.code === code) {
      return studentName;
    }
  }
  return null;
}

// Enhanced Student Tracking Functions with Professional Design for Parents
function accessStudentTracking() {
  const code = document.getElementById("studentTrackingCode").value.trim();

  if (!code) {
    showNotification("يرجى إدخال كود الطالب", "error");
    return;
  }

  const studentName = findStudentByTrackingCode(code);

  if (studentName) {
    loadEnhancedStudentProgressForParents(studentName);
    document.getElementById("studentCodeAccess").classList.add("hidden");
    document
      .getElementById("studentProgressContent")
      .classList.remove("hidden");
    showNotification(`تم تحميل سجل الطالب: ${studentName}`, "success");
  } else {
    showNotification(
      "كود غير صحيح. يرجى التحقق من الكود والمحاولة مرة أخرى",
      "error"
    );
  }
}

function findStudentByTrackingCode(code) {
  for (const [studentName, studentData] of Object.entries(studentCodes)) {
    if (studentData.code === code) {
      return studentName;
    }
  }
  return null;
}

// Professional Student Progress Display for Parents - Enhanced Version
function loadEnhancedStudentProgressForParents(studentName) {
  const container = document.getElementById("studentProgressContent");

  // Get or create clean student tracking data
  if (!studentTracking[studentName]) {
    studentTracking[studentName] = {};
  }

  const studentData = studentTracking[studentName];
  const studentClass = studentCodes[studentName]?.class || "class5A";

  const progressHtml = `
    <div class="parent-tracking-modern min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <!-- Header Section -->
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <div class="relative inline-block">
            <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h3 class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">${studentName}</h3>
          <p class="text-slate-600 text-xl font-medium">${getClassNameArabic(
            studentClass
          )} - سجل المتابعة التفصيلي</p>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mt-6 inline-block shadow-lg border border-white/20">
            <p class="text-slate-700 font-semibold text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              تقرير شامل ومحدث لأداء طالبكم
            </p>
          </div>
        </div>

        <!-- Enhanced Overall Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          ${generateStatCard(
            "الحضور",
            calculateOverallAttendance(studentData),
            "من-emerald-400 إلى-emerald-600",
            "attendance"
          )}
          ${generateStatCard(
            "الواجبات",
            calculateOverallHomework(studentData),
            "من-blue-400 إلى-blue-600",
            "homework"
          )}
          ${generateStatCard(
            "الاختبارات",
            calculateOverallTests(studentData),
            "من-purple-400 إلى-purple-600",
            "tests"
          )}
          ${generateBehaviorStatCard(
            "السلوك",
            calculateOverallBehavior(studentData),
            "behavior"
          )}
        </div>

        <!-- Professional Weekly Progress Cards -->
        <div class="mb-12">
          <h4 class="text-3xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            التقدم الأسبوعي
          </h4>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            ${generateProfessionalWeeklyCards(studentData, studentName)}
          </div>
        </div>

        <!-- Motivational Section -->
        <div class="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-3xl p-10 mb-12 border-2 border-emerald-200 shadow-xl">
          <div class="text-center">
            <div class="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h4 class="text-3xl font-bold text-emerald-800 mb-6">رسالة تحفيزية</h4>
            <p class="text-emerald-700 text-xl leading-relaxed max-w-4xl mx-auto">
              ${getMotivationalMessage(studentData)}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="text-center">
          <div class="flex flex-wrap gap-6 justify-center">
            <button onclick="resetStudentTracking()" 
                    class="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              عرض طالب آخر
            </button>
            <button onclick="printDetailedReport('${studentName}')" 
                    class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.5a2 2 0 01-2-2V5a2 2 0 012-2H17" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
              </svg>
              طباعة التقرير
            </button>
            <button onclick="shareProgressReport('${studentName}')" 
                    class="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              مشاركة التقرير
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Modal for Week Details -->
    <div id="weekDetailsModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-8 rounded-t-3xl">
          <div class="flex justify-between items-center">
            <h3 id="modalWeekTitle" class="text-3xl font-bold text-slate-800"></h3>
            <button onclick="closeWeekDetailsModal()" 
                    class="text-slate-500 hover:text-slate-700 text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors duration-200">
              ×
            </button>
          </div>
        </div>
        <div id="modalWeekContent" class="p-8">
          <!-- Week details will be loaded here -->
        </div>
      </div>
    </div>
  `;

  container.innerHTML = progressHtml;
}

// Enhanced Stat Card Generator
function generateStatCard(label, percentage, gradient, iconType) {
  const icons = {
    attendance: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>`,
    homework: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
    tests: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
  };

  return `
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div class="flex items-center justify-between mb-6">
        <div class="bg-gradient-to-r ${gradient} rounded-full w-12 h-12 flex items-center justify-center">
          ${icons[iconType] || icons.attendance}
        </div>
        <div class="bg-gradient-to-r ${gradient} rounded-full w-12 h-12 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
      </div>
      <div class="text-4xl font-bold text-slate-800 mb-2">${percentage}%</div>
      <div class="text-slate-600 font-medium text-lg">${label}</div>
      <div class="mt-4">
        <div class="w-full bg-slate-200 rounded-full h-3">
          <div class="bg-gradient-to-r ${gradient} h-3 rounded-full transition-all duration-1000 ease-out" style="width: ${percentage}%"></div>
        </div>
      </div>
    </div>
  `;
}

// Enhanced Behavior Stat Card
function generateBehaviorStatCard(label, behavior, iconType) {
  const behaviorColors = {
    ممتاز: "من-emerald-400 إلى-green-500",
    جيد: "من-blue-400 إلى-cyan-500",
    مقبول: "من-yellow-400 إلى-orange-500",
    "يحتاج تحسين": "من-orange-400 إلى-red-500",
  };

  return `
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div class="flex items-center justify-between mb-6">
        <div class="bg-gradient-to-r ${
          behaviorColors[behavior] || "من-slate-400 إلى-slate-500"
        } rounded-full w-12 h-12 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <div class="bg-gradient-to-r ${
          behaviorColors[behavior] || "من-slate-400 إلى-slate-500"
        } rounded-full w-12 h-12 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
      </div>
      <div class="text-4xl font-bold text-slate-800 mb-2">${behavior}</div>
      <div class="text-slate-600 font-medium text-lg">${label}</div>
      <div class="mt-4">
        <div class="bg-${behaviorColors[behavior] || "slate"}-100 text-${
    behaviorColors[behavior]?.split("-")[1] || "slate"
  }-800 px-4 py-2 rounded-full text-sm font-semibold text-center">
          ${getBehaviorIcon(behavior)} ${behavior}
        </div>
      </div>
    </div>
  `;
}

// Enhanced Weekly Cards Generator - Fixed days display issue
function generateProfessionalWeeklyCards(studentData, studentName) {
  const weeks = ["week1", "week2", "week3", "week4"];
  const weekNames = {
    week1: "الأسبوع الأول",
    week2: "الأسبوع الثاني",
    week3: "الأسبوع الثالث",
    week4: "الأسبوع الرابع",
  };

  // Define all days in order - Fixed the days issue
  const allDays = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
  const dayNames = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
  };

  return weeks
    .map((week) => {
      const weekData = studentData[week];

      if (
        !weekData ||
        !weekData.days ||
        Object.keys(weekData.days).length === 0
      ) {
        return `
        <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
          <div class="text-center">
            <div class="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl p-6 mb-6">
              <h4 class="text-2xl font-bold text-slate-800 mb-2">${weekNames[week]}</h4>
              <p class="text-slate-500">لم يتم إدخال بيانات بعد</p>
            </div>
            
            <div class="py-16">
              <div class="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-slate-500 text-xl mb-4">لا توجد بيانات متابعة لهذا الأسبوع</p>
              <p class="text-slate-400">سيتم إضافة البيانات من قبل المعلم</p>
            </div>
          </div>
        </div>
      `;
      }

      const weekStats = calculateWeekStats(weekData);

      return `
      <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
        <!-- Week Header -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
          <h4 class="text-2xl font-bold text-slate-800 mb-2">${
            weekNames[week]
          }</h4>
          <p class="text-slate-600 font-medium">آخر تحديث: ${getLastWeekUpdate(
            weekData
          )}</p>
        </div>
        
        <!-- Week Summary Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="text-center bg-emerald-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-emerald-600">${
              weekStats.attendance
            }%</div>
            <div class="text-emerald-700 font-medium">الحضور</div>
          </div>
          <div class="text-center bg-blue-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-blue-600">${
              weekStats.homework
            }%</div>
            <div class="text-blue-700 font-medium">الواجبات</div>
          </div>
          <div class="text-center bg-purple-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-purple-600">${
              weekStats.tests
            }%</div>
            <div class="text-purple-700 font-medium">الاختبارات</div>
          </div>
          <div class="text-center bg-orange-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-orange-600">${
              weekStats.behavior
            }</div>
            <div class="text-orange-700 font-medium">السلوك</div>
          </div>
        </div>
        
        <!-- Enhanced Days Overview - Fixed to show all days -->
        <div class="mb-8">
          <h5 class="text-lg font-semibold text-slate-700 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            نظرة عامة على الأيام
          </h5>
          <div class="grid grid-cols-5 gap-3">
            ${allDays
              .map((day) => {
                const dayData = weekData.days[day];
                const hasData = dayData && dayData.attendance;

                return `
                <div class="text-center">
                  <div class="text-sm font-medium text-slate-600 mb-2">${
                    dayNames[day]
                  }</div>
                  <div class="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-lg font-bold
                    ${
                      hasData
                        ? dayData.attendance === "present"
                          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                          : dayData.attendance === "late"
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                          : "bg-red-100 text-red-700 border-2 border-red-200"
                        : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                    }">
                    ${
                      hasData
                        ? dayData.attendance === "present"
                          ? "✓"
                          : dayData.attendance === "late"
                          ? "⚠"
                          : "✗"
                        : "?"
                    }
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
        
        <!-- Week Highlights -->
        <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 mb-6">
          <h5 class="font-bold text-emerald-800 mb-3 text-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            أبرز الإنجازات
          </h5>
          <p class="text-emerald-700 leading-relaxed">${getWeekHighlights(
            weekData
          )}</p>
        </div>
        
        <!-- View Details Button -->
        <div class="text-center">
          <button onclick="showWeekDetails('${week}', '${
        weekNames[week]
      }', '${studentName}')" 
                  class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            عرض التفاصيل الكاملة
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

// Enhanced Week Details Modal - Improved Performance
function showWeekDetails(week, weekName, studentName) {
  const studentData = studentTracking[studentName];

  if (!studentData || !studentData[week] || !studentData[week].days) {
    showNotification("لا توجد بيانات متاحة لهذا الأسبوع", "info");
    return;
  }

  const weekData = studentData[week];
  const modal = document.getElementById("weekDetailsModal");
  const modalTitle = document.getElementById("modalWeekTitle");
  const modalContent = document.getElementById("modalWeekContent");

  modalTitle.textContent = `${weekName} - ${studentName}`;

  const allDays = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
  const dayNames = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
  };

  // Generate content with performance optimization
  const detailsHtml = `
    <div class="space-y-8">
      <!-- Week Statistics Summary -->
      <div class="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-8 shadow-lg">
        <h4 class="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          إحصائيات الأسبوع
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          ${generateWeekStatItem(
            "الحضور",
            calculateWeekStats(weekData).attendance + "%",
            "emerald"
          )}
          ${generateWeekStatItem(
            "الواجبات",
            calculateWeekStats(weekData).homework + "%",
            "blue"
          )}
          ${generateWeekStatItem(
            "الاختبارات",
            calculateWeekStats(weekData).tests + "%",
            "purple"
          )}
          ${generateWeekStatItem(
            "السلوك",
            calculateWeekStats(weekData).behavior,
            "orange"
          )}
        </div>
      </div>

      <!-- Daily Details Grid -->
      <div class="space-y-6">
        <h4 class="text-2xl font-bold text-slate-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          تفاصيل الأيام
        </h4>
        <div class="grid gap-6">
          ${allDays
            .map((day) => {
              const dayData = weekData.days[day];
              if (!dayData) return generateEmptyDayCard(day, dayNames[day]);
              return generateDayDetailCard(day, dayNames[day], dayData);
            })
            .join("")}
        </div>
      </div>
    </div>
  `;

  modalContent.innerHTML = detailsHtml;
  modal.classList.remove("hidden");

  // Add close on outside click
  modal.onclick = (e) => e.target === modal && closeWeekDetailsModal();

  showNotification(`تم عرض تفاصيل ${weekName}`, "success");
}

// Helper function for week stats in modal
function generateWeekStatItem(label, value, color) {
  return `
    <div class="text-center bg-white rounded-xl p-4 shadow-md">
      <div class="text-3xl font-bold text-${color}-600 mb-2">${value}</div>
      <div class="text-slate-600 font-medium">${label}</div>
    </div>
  `;
}

// Generate detailed day card
function generateDayDetailCard(day, dayName, dayData) {
  return `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div class="flex items-center justify-between mb-6">
        <h5 class="text-xl font-bold text-slate-800 flex items-center">
          <span class="text-2xl mr-2">${getDayEmoji(day)}</span>
          ${dayName}
        </h5>
        <span class="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          ${dayData.lastUpdated || "غير محدد"}
        </span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${generateDayMetricCard(
          "الحضور",
          "attendance",
          getAttendanceText(dayData.attendance),
          getAttendanceColor(dayData.attendance)
        )}
        
        ${
          dayData.participation?.level
            ? generateDayMetricCard(
                "المشاركة",
                "participation",
                getParticipationText(dayData.participation.level) +
                  (dayData.participation.score
                    ? ` (${dayData.participation.score}/10)`
                    : ""),
                getParticipationColor(dayData.participation.level)
              )
            : ""
        }
        
        ${
          dayData.homework?.name
            ? generateDayMetricCard(
                "الواجب",
                "homework",
                dayData.homework.name +
                  " - " +
                  getHomeworkText(dayData.homework.status) +
                  (dayData.homework.score && dayData.homework.total
                    ? ` (${dayData.homework.score}/${dayData.homework.total})`
                    : ""),
                getHomeworkColor(dayData.homework.status)
              )
            : ""
        }
        
        ${
          dayData.tests?.name
            ? generateDayMetricCard(
                "اختبار",
                "tests",
                dayData.tests.name +
                  ` - ${dayData.tests.score}/${
                    dayData.tests.total
                  } (${Math.round(
                    (dayData.tests.score / dayData.tests.total) * 100
                  )}%)`,
                "text-blue-600"
              )
            : ""
        }
        
        ${
          dayData.behavior?.level
            ? generateDayMetricCard(
                "السلوك",
                "behavior",
                getBehaviorText(dayData.behavior.level) +
                  (dayData.behavior.score
                    ? ` (${dayData.behavior.score}/10)`
                    : ""),
                getBehaviorColor(dayData.behavior.level)
              )
            : ""
        }
      </div>

      ${
        dayData.notes
          ? `
        <div class="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-semibold text-slate-700">ملاحظات</span>
          </div>
          <p class="text-slate-700 italic leading-relaxed">${dayData.notes}</p>
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Generate day metric card
function generateDayMetricCard(title, iconType, content, colorClass) {
  const icons = {
    attendance: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>`,
    participation: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
    </svg>`,
    homework: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
    tests: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    behavior: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>`,
  };

  return `
    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div class="flex items-center mb-3">
        ${icons[iconType] || icons.attendance}
        <span class="font-semibold text-slate-700">${title}</span>
      </div>
      <div class="font-bold ${colorClass} text-sm leading-relaxed">${content}</div>
    </div>
  `;
}

// Generate empty day card
function generateEmptyDayCard(day, dayName) {
  return `
    <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
      <h5 class="text-lg font-semibold text-slate-600 mb-2 flex items-center justify-center">
        <span class="text-xl mr-2">${getDayEmoji(day)}</span>
        ${dayName}
      </h5>
      <p class="text-slate-500">لا توجد بيانات لهذا اليوم</p>
    </div>
  `;
}

// Helper function to get day emoji
function getDayEmoji(day) {
  const emojis = {
    sunday: "🟢",
    monday: "🔵",
    tuesday: "🟡",
    wednesday: "🟣",
    thursday: "🟠",
  };
  return emojis[day] || "📅";
}

// Rest of helper functions remain the same but with performance improvements
function calculateWeekStats(weekData) {
  if (!weekData.days)
    return { attendance: 0, homework: 0, tests: 0, behavior: "غير محدد" };

  const days = Object.values(weekData.days);
  const totalDays = days.length;

  if (totalDays === 0)
    return { attendance: 0, homework: 0, tests: 0, behavior: "غير محدد" };

  // Calculate attendance
  const presentDays = days.filter((day) => day.attendance === "present").length;
  const attendance = Math.round((presentDays / totalDays) * 100);

  // Calculate homework
  const homeworkDays = days.filter((day) => day.homework?.name);
  const completedHomework = homeworkDays.filter(
    (day) => day.homework.status === "completed"
  ).length;
  const homework =
    homeworkDays.length > 0
      ? Math.round((completedHomework / homeworkDays.length) * 100)
      : 0;

  // Calculate tests
  const testDays = days.filter((day) => day.tests?.name && day.tests.score > 0);
  const totalTestScore = testDays.reduce(
    (sum, day) => sum + day.tests.score,
    0
  );
  const totalTestMax = testDays.reduce((sum, day) => sum + day.tests.total, 0);
  const tests =
    totalTestMax > 0 ? Math.round((totalTestScore / totalTestMax) * 100) : 0;

  // Calculate behavior
  const behaviorDays = days.filter((day) => day.behavior?.score > 0);
  const avgBehavior =
    behaviorDays.length > 0
      ? behaviorDays.reduce((sum, day) => sum + day.behavior.score, 0) /
        behaviorDays.length
      : 0;

  const behavior =
    avgBehavior >= 9
      ? "ممتاز"
      : avgBehavior >= 7
      ? "جيد"
      : avgBehavior >= 5
      ? "مقبول"
      : "يحتاج تحسين";

  return { attendance, homework, tests, behavior };
}

// Performance optimized calculation functions
function calculateOverallAttendance(studentData) {
  const stats = Object.values(studentData).reduce(
    (acc, week) => {
      if (week.days) {
        Object.values(week.days).forEach((day) => {
          acc.total++;
          if (day.attendance === "present") acc.present++;
        });
      }
      return acc;
    },
    { total: 0, present: 0 }
  );

  return stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
}

function calculateOverallHomework(studentData) {
  const stats = Object.values(studentData).reduce(
    (acc, week) => {
      if (week.days) {
        Object.values(week.days).forEach((day) => {
          if (day.homework?.name) {
            acc.total++;
            if (day.homework.status === "completed") acc.completed++;
          }
        });
      }
      return acc;
    },
    { total: 0, completed: 0 }
  );

  return stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
}

function calculateOverallTests(studentData) {
  const stats = Object.values(studentData).reduce(
    (acc, week) => {
      if (week.days) {
        Object.values(week.days).forEach((day) => {
          if (day.tests?.name && day.tests.score > 0) {
            acc.totalScore += day.tests.score;
            acc.totalMax += day.tests.total;
          }
        });
      }
      return acc;
    },
    { totalScore: 0, totalMax: 0 }
  );

  return stats.totalMax > 0
    ? Math.round((stats.totalScore / stats.totalMax) * 100)
    : 0;
}

function calculateOverallBehavior(studentData) {
  const scores = [];
  Object.values(studentData).forEach((week) => {
    if (week.days) {
      Object.values(week.days).forEach((day) => {
        if (day.behavior?.score > 0) scores.push(day.behavior.score);
      });
    }
  });

  if (scores.length === 0) return "غير محدد";

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return average >= 9
    ? "ممتاز"
    : average >= 7
    ? "جيد"
    : average >= 5
    ? "مقبول"
    : "يحتاج تحسين";
}

// Enhanced helper functions with better performance
const getAttendanceText = (status) =>
  ({ present: "حاضر", absent: "غائب", late: "متأخر" }[status] || "غير محدد");
const getAttendanceColor = (status) =>
  ({
    present: "text-emerald-600",
    absent: "text-red-600",
    late: "text-yellow-600",
  }[status] || "text-slate-600");

const getParticipationText = (level) =>
  ({ excellent: "ممتاز", good: "جيد", weak: "ضعيف" }[level] || "غير محدد");
const getParticipationColor = (level) =>
  ({
    excellent: "text-emerald-600",
    good: "text-blue-600",
    weak: "text-orange-600",
  }[level] || "text-slate-600");

const getHomeworkText = (status) =>
  ({ completed: "مكتمل", partial: "جزئي", missing: "مفقود", late: "متأخر" }[
    status
  ] || "غير محدد");
const getHomeworkColor = (status) =>
  ({
    completed: "text-emerald-600",
    partial: "text-yellow-600",
    missing: "text-red-600",
    late: "text-orange-600",
  }[status] || "text-slate-600");

const getBehaviorText = (level) =>
  ({
    excellent: "ممتاز",
    good: "جيد",
    fair: "مقبول",
    needs_improvement: "يحتاج تحسين",
  }[level] || "غير محدد");
const getBehaviorColor = (level) =>
  ({
    excellent: "text-emerald-600",
    good: "text-blue-600",
    fair: "text-yellow-600",
    needs_improvement: "text-orange-600",
  }[level] || "text-slate-600");

function getBehaviorIcon(behavior) {
  const icons = {
    ممتاز: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>`,
    جيد: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2H4.5a2.5 2.5 0 000 5H7m7 5v4.5a2.5 2.5 0 01-5 0V14m0 0H4.5a2.5 2.5 0 010-5H7m0-5v5h3m-3 0H4" />
    </svg>`,
    مقبول: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    "يحتاج تحسين": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>`,
  };
  return (
    icons[behavior] ||
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>`
  );
}

function getLastWeekUpdate(weekData) {
  if (!weekData.days) return "غير محدد";

  const dates = Object.values(weekData.days)
    .map((day) => day.lastUpdated)
    .filter((date) => date)
    .map((date) => new Date(date));

  return dates.length > 0
    ? new Date(Math.max(...dates)).toLocaleDateString("ar-SA")
    : "غير محدد";
}

function getWeekHighlights(weekData) {
  const highlights = [];
  const days = Object.values(weekData.days);

  // Perfect attendance
  const presentDays = days.filter((day) => day.attendance === "present").length;
  if (presentDays === days.length && days.length > 0) {
    highlights.push("🎯 حضور مثالي طوال الأسبوع");
  }

  // Completed homework
  const homeworkDays = days.filter(
    (day) => day.homework?.status === "completed"
  );
  if (homeworkDays.length > 0) {
    highlights.push(`📝 أنجز ${homeworkDays.length} واجب بنجاح`);
  }

  // Excellent behavior
  const excellentBehaviorDays = days.filter(
    (day) => day.behavior?.level === "excellent"
  );
  if (excellentBehaviorDays.length > 0) {
    highlights.push(`⭐ سلوك ممتاز في ${excellentBehaviorDays.length} أيام`);
  }

  // High test scores
  const highScoreTests = days.filter(
    (day) =>
      day.tests?.score &&
      day.tests?.total &&
      day.tests.score / day.tests.total >= 0.8
  );
  if (highScoreTests.length > 0) {
    highlights.push(`🏆 حقق درجات عالية في ${highScoreTests.length} اختبار`);
  }

  return highlights.length > 0
    ? highlights.join(" • ")
    : "استمر في العمل الجاد للوصول لأهدافك!";
}

function getMotivationalMessage(studentData) {
  const attendance = calculateOverallAttendance(studentData);
  const homework = calculateOverallHomework(studentData);
  const tests = calculateOverallTests(studentData);

  if (attendance >= 90 && homework >= 80 && tests >= 80) {
    return "أداء رائع ومتميز! طالبكم يحقق نتائج ممتازة في جميع المجالات. استمروا في دعمه وتشجيعه على هذا المستوى المتقدم.";
  } else if (attendance >= 80 && homework >= 70) {
    return "أداء جيد ومشجع! هناك تقدم ملحوظ في الأداء، وبالمزيد من الدعم والمتابعة المستمرة سيحقق نتائج أفضل.";
  } else {
    return "نحن نعمل معاً لتطوير أداء طالبكم وتحقيق إمكاناته الكاملة. المتابعة المستمرة والتشجيع سيساعدانه على تحقيق أهدافه التعليمية.";
  }
}

// Enhanced close modal function
function closeWeekDetailsModal() {
  const modal = document.getElementById("weekDetailsModal");
  modal.classList.add("hidden");
}

// Keyboard support for modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWeekDetailsModal();
});

// Enhanced sharing function
function shareProgressReport(studentName) {
  const studentData = studentTracking[studentName];
  if (!studentData) return;

  const shareText = `📊 تقرير تقدم الطالب: ${studentName}

🎯 الإحصائيات العامة:
• نسبة الحضور: ${calculateOverallAttendance(studentData)}%
• إنجاز الواجبات: ${calculateOverallHomework(studentData)}%
• نتائج الاختبارات: ${calculateOverallTests(studentData)}%
• تقييم السلوك: ${calculateOverallBehavior(studentData)}

💫 ${getMotivationalMessage(studentData)}

📚 موقع الأستاذ علي العيسني للرياضيات
📅 ${new Date().toLocaleDateString("ar-SA")}`;

  if (navigator.share) {
    navigator.share({ title: `تقرير ${studentName}`, text: shareText });
  } else {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
  }
  showNotification("تم إعداد التقرير للمشاركة!", "success");
}

function printDetailedReport(studentName) {
  window.print();
  showNotification("تم تحضير التقرير للطباعة", "success");
}

function resetStudentTracking() {
  document.getElementById("studentCodeAccess").classList.remove("hidden");
  document.getElementById("studentProgressContent").classList.add("hidden");
  document.getElementById("studentTrackingCode").value = "";
}

// ========== الوظائف المفقودة لإدارة المعلم ==========

// بيانات الطلاب والأكواد المحدثة
const studentCodes = {
  // الصف 5A
  "أحمد الهاشم": { code: "3847", class: "class5A" },
  "أمير الاحمد": { code: "7291", class: "class5A" },
  "أمير آل هلال": { code: "5613", class: "class5A" },
  "ابراهيم آل معتوق": { code: "9482", class: "class5A" },
  "احمد المسكين": { code: "2756", class: "class5A" },
  "الياس وقع": { code: "8174", class: "class5A" },
  "جواد الخاتم": { code: "4329", class: "class5A" },
  "جواد العامر": { code: "6851", class: "class5A" },
  "حسن اعجيمي": { code: "1967", class: "class5A" },
  "حسن الرمضان": { code: "7435", class: "class5A" },
  "حسن آل خيري": { code: "5820", class: "class5A" },
  "حسين المطوع": { code: "3164", class: "class5A" },
  "حسين البحراني": { code: "9247", class: "class5A" },
  "حيدر اليوسف": { code: "4682", class: "class5A" },
  "حيدر امنيان": { code: "7056", class: "class5A" },
  "حيدر مكيحيل": { code: "2398", class: "class5A" },
  "سجاد السليمان": { code: "8541", class: "class5A" },
  "عبد الله آل مطرود": { code: "1789", class: "class5A" },
  "عبدالرحمن مرشد": { code: "6234", class: "class5A" },
  "عبدالله الملاك": { code: "4907", class: "class5A" },
  "علي آل سالم": { code: "7813", class: "class5A" },
  "علي آل مطر": { code: "3526", class: "class5A" },
  "عمار الرميح": { code: "9148", class: "class5A" },
  "کرار السيهاتي": { code: "5672", class: "class5A" },
  "ليث السيهاتي": { code: "2419", class: "class5A" },
  "محمد آل حمود": { code: "8756", class: "class5A" },
  "محمد آل عبدرب الرضا": { code: "4283", class: "class5A" },
  "محمد آل حميد": { code: "7641", class: "class5A" },
  "محمد المطوع": { code: "1397", class: "class5A" },
  "محمد آل يوسف": { code: "6052", class: "class5A" },
  "منتظر آل حمزه": { code: "3874", class: "class5A" },
  "ناصر آل نصيف": { code: "9165", class: "class5A" },
  "نصر الرمضان": { code: "5428", class: "class5A" },
  "هادي السبع": { code: "7239", class: "class5A" },
  "يوسف الصائغ": { code: "2681", class: "class5A" },
  "يوسف العجيمي": { code: "8504", class: "class5A" },
  "أحمد المنصور": { code: "5729", class: "class6D" },
  "أمير الخاتم": { code: "8146", class: "class6D" },
  "أمير السعود": { code: "3924", class: "class6D" },
  "أمير آل سواد": { code: "7281", class: "class6D" },
  "احمد محمد": { code: "4637", class: "class6D" },
  "تركي الحلال": { code: "9385", class: "class6D" },
  "حسن الهاشم": { code: "2156", class: "class6D" },
  "حسن قواحمد": { code: "6748", class: "class6D" },
  "حسين خريده": { code: "1892", class: "class6D" },
  "ريان الحكيم": { code: "5473", class: "class6D" },
  "صالح آل هلال": { code: "8917", class: "class6D" },
  "علي السواد": { code: "3265", class: "class6D" },
  "علي المدن": { code: "7549", class: "class6D" },
  "علي آل خميس": { code: "4183", class: "class6D" },
  "علي السبع": { code: "9726", class: "class6D" },
  "علي المطر": { code: "2847", class: "class6D" },
  "عمران الرمضان": { code: "6391", class: "class6D" },
  "محمد المريط": { code: "1574", class: "class6D" },
  "محمد الحسين": { code: "8025", class: "class6D" },
  "محمد العيسني": { code: "1234", class: "class6D" },
  "محمد المريط الثاني": { code: "9512", class: "class6D" },
  "منصور الباشا": { code: "3697", class: "class6D" },
  "مهدي آل مال الله": { code: "7284", class: "class6D" },
  "ميثم آل سليس": { code: "5831", class: "class6D" },
  "هادي آل خليفه": { code: "2459", class: "class6D" },
  "هشام السيهاتي": { code: "8673", class: "class6D" },
  "هشام المسكين": { code: "4216", class: "class6D" },
  "يوسف السنبسي": { code: "7958", class: "class6D" },
  "أمير العوامي": { code: "6429", class: "class6H" },
  "الياس الصرنوخ": { code: "3817", class: "class6H" },
  "باسل آل سواد": { code: "9254", class: "class6H" },
  "جواد العجمي": { code: "5672", class: "class6H" },
  "حبيب زين الدين": { code: "8391", class: "class6H" },
  "حسن آل جراد": { code: "4128", class: "class6H" },
  "حسن آل مريط": { code: "7563", class: "class6H" },
  "حسين الخواهر": { code: "2945", class: "class6H" },
  "رضا آل عيد": { code: "6184", class: "class6H" },
  "رضا العمران": { code: "3756", class: "class6H" },
  "سعيد آل درويش": { code: "9817", class: "class6H" },
  "سيف آل طريش": { code: "5294", class: "class6H" },
  "عباس الحمادي": { code: "7635", class: "class6H" },
  "عبدالله آل سليس": { code: "4981", class: "class6H" },
  "علي الدلي": { code: "8273", class: "class6H" },
  "علي البو": { code: "2459", class: "class6H" },
  "علي آل صليبي": { code: "6847", class: "class6H" },
  "علي آل فاضل": { code: "3182", class: "class6H" },
  "فارس اعجيمي": { code: "9365", class: "class6H" },
  "قمر السيهاتي": { code: "5748", class: "class6H" },
  "كميل حسين": { code: "7291", class: "class6H" },
  "محمد التركي": { code: "4657", class: "class6H" },
  "محمد المزعل": { code: "8924", class: "class6H" },
  "محمد الباشا": { code: "3516", class: "class6H" },
  "ناصر السيهاتي": { code: "6739", class: "class6H" },
  "نبراس آل سواد": { code: "2483", class: "class6H" },
  "هادي السبع": { code: "8175", class: "class6H" },
  "يوسف آل محفوظ": { code: "5692", class: "class6H" },
};

const classStudents = {
  class5A: [
    "أحمد الهاشم",
    "أمير الاحمد",
    "أمير آل هلال",
    "ابراهيم آل معتوق",
    "احمد المسكين",
    "الياس وقع",
    "جواد الخاتم",
    "جواد العامر",
    "حسن اعجيمي",
    "حسن الرمضان",
    "حسن آل خيري",
    "حسين المطوع",
    "حسين البحراني",
    "حيدر اليوسف",
    "حيدر امنيان",
    "حيدر مكيحيل",
    "سجاد السليمان",
    "عبد الله آل مطرود",
    "عبدالرحمن مرشد",
    "عبدالله الملاك",
    "علي آل سالم",
    "علي آل مطر",
    "عمار الرميح",
    "کرار السيهاتي",
    "ليث السيهاتي",
    "محمد آل حمود",
    "محمد آل عبدرب الرضا",
    "محمد آل حميد",
    "محمد المطوع",
    "محمد آل يوسف",
    "منتظر آل حمزه",
    "ناصر آل نصيف",
    "نصر الرمضان",
    "هادي السبع",
    "يوسف الصائغ",
    "يوسف العجيمي",
  ],
  class6D: [
    "أحمد المنصور",
    "أمير الخاتم",
    "أمير السعود",
    "أمير آل سواد",
    "احمد محمد",
    "تركي الحلال",
    "حسن الهاشم",
    "حسن قواحمد",
    "حسين خريده",
    "ريان الحكيم",
    "صالح آل هلال",
    "علي السواد",
    "علي المدن",
    "علي آل خمیس",
    "علي السبع",
    "علي المطر",
    "عمران الرمضان",
    "محمد المريط",
    "محمد الحسين",
    "محمد العيسني",
    "محمد المريط",
    "منصور الباشا",
    "مهدي آل مال الله",
    "میثم آل سليس",
    "هادي آل خلیفه",
    "هشام السيهاتي",
    "هشام المسكين",
    "يوسف السنبسي",
  ],
  class6H: [
    "أمير العوامي",
    "الياس الصرنوخ",
    "باسل آل سواد",
    "جواد العجمي",
    "حبيب زين الدين",
    "حسن آل جراد",
    "حسن آل مريط",
    "حسین الخواهر",
    "رضا آل عيد",
    "رضا العمران",
    "سعيد آل درويش",
    "سيف آل طريش",
    "عباس الحمادي",
    "عبدالله آل سليس",
    "علي الدلي",
    "علي البو",
    "علي آل صليبي",
    "علي آل فاضل",
    "فارس اعجيمي",
    "قمر السيهاتي",
    "كميل حسین",
    "محمد التركي",
    "محمد المزعل",
    "محمد الباشا",
    "ناصر السيهاتي",
    "نبراس آل سواد",
    "هادي السبع",
    "يوسف آل محفوظ",
  ],
};

function getStudentsByClass(studentCodes) {
  const result = {};

  Object.entries(studentCodes).forEach(([name, info]) => {
    const className = info.class;

    // لو الصف ما هو موجود يضاف
    if (!result[className]) {
      result[className] = [];
    }

    // نضيف الطالب مع بياناته
    result[className].push({
      name: name,
      code: info.code,
      class: className,
    });
  });

  return result;
}

// الاستخدام
const studentsGrouped = getStudentsByClass(studentCodes);

console.log(studentsGrouped);

function getClassStudents(studentCodes, className) {
  return Object.entries(studentCodes)
    .filter(([_, info]) => info.class === className)
    .map(([name, info]) => ({
      name,
      code: info.code,
      class: info.class,
    }));
}

// مثال استخدام:
const class6DStudents = getClassStudents(studentCodes, "class6D");
console.log(class6DStudents);

let studentTracking = {};

// وظيفة تحميل الطلاب حسب الصف
function loadStudentsByClass() {
  const classSelect = document.getElementById("teacherClassSelect");
  const studentSelect = document.getElementById("teacherStudentSelect");

  const selectedClass = classSelect.value;

  // مسح الطلاب السابقين
  studentSelect.innerHTML = '<option value="">اختر الطالب</option>';

  if (selectedClass && classStudents[selectedClass]) {
    studentSelect.disabled = false;
    classStudents[selectedClass].forEach((student) => {
      const option = document.createElement("option");
      option.value = student;
      option.textContent = student;
      studentSelect.appendChild(option);
    });
    showNotification("تم تحميل قائمة الطلاب", "success");
  } else {
    studentSelect.disabled = true;
  }
}

// الوظيفة المفقودة الرئيسية - تحميل البيانات
function loadStudentForAdvancedEditing() {
  const classSelect = document.getElementById("teacherClassSelect");
  const studentSelect = document.getElementById("teacherStudentSelect");
  const weekSelect = document.getElementById("weekSelect");

  const selectedClass = classSelect.value;
  const selectedStudent = studentSelect.value;
  const selectedWeek = weekSelect.value;

  if (!selectedClass) {
    showNotification("يرجى اختيار الصف الدراسي أولاً", "error");
    return;
  }

  if (!selectedStudent) {
    showNotification("يرجى اختيار الطالب", "error");
    return;
  }

  if (!selectedWeek) {
    showNotification("يرجى اختيار الأسبوع الدراسي", "error");
    return;
  }

  // إنشاء بنية البيانات إذا لم تكن موجودة
  if (!studentTracking[selectedStudent]) {
    studentTracking[selectedStudent] = {};
  }

  if (!studentTracking[selectedStudent][selectedWeek]) {
    studentTracking[selectedStudent][selectedWeek] = {
      days: {},
    };
  }

  // عرض نموذج التتبع المتقدم
  document.getElementById("advancedTrackingForm").classList.remove("hidden");

  // تحديث عنوان النموذج
  const formTitle = document.querySelector("#advancedTrackingForm h4");
  if (formTitle) {
    formTitle.textContent = `تسجيل المتابعة اليومية - ${selectedStudent} - ${getWeekNameArabic(
      selectedWeek
    )}`;
  }

  showNotification(
    `تم تحميل بيانات ${selectedStudent} للـ${getWeekNameArabic(selectedWeek)}`,
    "success"
  );

  // التمرير إلى النموذج
  document.getElementById("advancedTrackingForm").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// وظيفة مساعدة للحصول على اسم الأسبوع بالعربية
function getWeekNameArabic(week) {
  const weekNames = {
    week1: "الأسبوع الأول",
    week2: "الأسبوع الثاني",
    week3: "الأسبوع الثالث",
    week4: "الأسبوع الرابع",
  };
  return weekNames[week] || week;
}

// وظيفة مساعدة للحصول على اسم الصف بالعربية
function getClassNameArabic(className) {
  const classNames = {
    class5A: "الخامس الابتدائي - أ",
    class6D: "السادس الابتدائي - د",
    class6H: "السادس الابتدائي - هـ",
  };
  return classNames[className] || className;
}

function selectDay(day) {
  // إزالة التحديد السابق
  document.querySelectorAll(".day-selector").forEach((btn) => {
    btn.classList.remove("active");
  });

  // إضافة التحديد الجديد
  document.querySelector(`[data-day="${day}"]`).classList.add("active");
  selectedDay = day;

  // عرض نموذج تفاصيل اليوم
  document.getElementById("dayDetailsForm").classList.remove("hidden");

  // تحميل البيانات المحفوظة إن وجدت
  loadDayData(day);

  showNotification(`تم اختيار يوم ${getDayNameArabic(day)}`, "info");
}

// وظيفة الحصول على اسم اليوم بالعربية
function getDayNameArabic(day) {
  const dayNames = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
  };
  return dayNames[day] || day;
}

// وظيفة تحميل بيانات اليوم المحفوظة
function loadDayData(day) {
  const studentSelect = document.getElementById("teacherStudentSelect");
  const weekSelect = document.getElementById("weekSelect");

  const selectedStudent = studentSelect.value;
  const selectedWeek = weekSelect.value;

  if (
    studentTracking[selectedStudent] &&
    studentTracking[selectedStudent][selectedWeek] &&
    studentTracking[selectedStudent][selectedWeek].days[day]
  ) {
    const dayData = studentTracking[selectedStudent][selectedWeek].days[day];

    // تحميل البيانات في النماذج
    document.getElementById("attendanceSelect").value =
      dayData.attendance || "";
    document.getElementById("participationSelect").value =
      dayData.participation?.level || "";
    document.getElementById("participationScore").value =
      dayData.participation?.score || "";
    document.getElementById("homeworkName").value =
      dayData.homework?.name || "";
    document.getElementById("homeworkStatus").value =
      dayData.homework?.status || "";
    document.getElementById("homeworkScore").value =
      dayData.homework?.score || "";
    document.getElementById("homeworkTotal").value =
      dayData.homework?.total || "";
    document.getElementById("behaviorSelect").value =
      dayData.behavior?.level || "";
    document.getElementById("behaviorScore").value =
      dayData.behavior?.score || "";
    document.getElementById("testName").value = dayData.tests?.name || "";
    document.getElementById("testScore").value = dayData.tests?.score || "";
    document.getElementById("testTotal").value = dayData.tests?.total || "";
    document.getElementById("testType").value = dayData.tests?.type || "";
    document.getElementById("activityName").value =
      dayData.activities?.name || "";
    document.getElementById("activityStatus").value =
      dayData.activities?.status || "";
    document.getElementById("activityScore").value =
      dayData.activities?.score || "";
    document.getElementById("detailedNotes").value = dayData.notes || "";
  } else {
    // مسح النماذج للبيانات الجديدة
    clearDayForms();
  }
}

// وظيفة مسح نماذج اليوم
function clearDayForms() {
  const inputs = [
    "attendanceSelect",
    "participationSelect",
    "participationScore",
    "homeworkName",
    "homeworkStatus",
    "homeworkScore",
    "homeworkTotal",
    "behaviorSelect",
    "behaviorScore",
    "testName",
    "testScore",
    "testTotal",
    "testType",
    "activityName",
    "activityStatus",
    "activityScore",
    "detailedNotes",
  ];

  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = "";
    }
  });
}

// وظيفة حفظ تقدم اليوم
function saveDayProgress() {
  if (!selectedDay) {
    showNotification("يرجى اختيار اليوم أولاً", "error");
    return;
  }

  const studentSelect = document.getElementById("teacherStudentSelect");
  const weekSelect = document.getElementById("weekSelect");

  const selectedStudent = studentSelect.value;
  const selectedWeek = weekSelect.value;

  if (!selectedStudent || !selectedWeek) {
    showNotification("يرجى التأكد من اختيار الطالب والأسبوع", "error");
    return;
  }

  // جمع البيانات
  const dayData = {
    attendance: document.getElementById("attendanceSelect").value,
    participation: {
      level: document.getElementById("participationSelect").value,
      score: parseInt(document.getElementById("participationScore").value) || 0,
    },
    homework: {
      name: document.getElementById("homeworkName").value,
      status: document.getElementById("homeworkStatus").value,
      score: parseInt(document.getElementById("homeworkScore").value) || 0,
      total: parseInt(document.getElementById("homeworkTotal").value) || 0,
    },
    behavior: {
      level: document.getElementById("behaviorSelect").value,
      score: parseInt(document.getElementById("behaviorScore").value) || 0,
    },
    tests: {
      name: document.getElementById("testName").value,
      score: parseInt(document.getElementById("testScore").value) || 0,
      total: parseInt(document.getElementById("testTotal").value) || 0,
      type: document.getElementById("testType").value,
    },
    activities: {
      name: document.getElementById("activityName").value,
      status: document.getElementById("activityStatus").value,
      score: parseInt(document.getElementById("activityScore").value) || 0,
    },
    notes: document.getElementById("detailedNotes").value,
    lastUpdated: new Date().toISOString(),
  };

  // حفظ البيانات
  if (!studentTracking[selectedStudent]) {
    studentTracking[selectedStudent] = {};
  }
  if (!studentTracking[selectedStudent][selectedWeek]) {
    studentTracking[selectedStudent][selectedWeek] = { days: {} };
  }

  studentTracking[selectedStudent][selectedWeek].days[selectedDay] = dayData;

  showNotification(
    `تم حفظ بيانات يوم ${getDayNameArabic(selectedDay)} بنجاح!`,
    "success"
  );

  console.log("تم حفظ البيانات:", studentTracking);
}

// وظيفة عرض نموذج إدخال الدرجات السريع
function showQuickTestsEntry() {
  const testType = document.getElementById("quickTestType").value;
  const testName = document.getElementById("quickTestName").value;

  if (!testName.trim()) {
    showNotification("يرجى إدخال عنوان الاختبار", "error");
    return;
  }

  const classSelect = document.getElementById("teacherClassSelect");
  const selectedClass = classSelect.value;

  if (!selectedClass || !classStudents[selectedClass]) {
    showNotification("يرجى اختيار الصف أولاً", "error");
    return;
  }

  // إنشاء قائمة الطلاب للاختبار
  const studentsListContainer = document.getElementById("studentsTestsList");
  studentsListContainer.innerHTML = "";

  classStudents[selectedClass].forEach((student) => {
    const studentDiv = document.createElement("div");
    studentDiv.className =
      "bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200";
    studentDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="bg-blue-600 rounded-xl w-12 h-12 flex items-center justify-center ml-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h5 class="text-xl font-bold text-blue-800">${student}</h5>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-left">
            <label class="block text-sm font-medium text-blue-700 mb-1">الدرجة المحققة</label>
            <input type="number" 
                   id="score-${student.replace(/\s+/g, "-")}" 
                   class="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-center font-bold" 
                   min="0" 
                   placeholder="0">
          </div>
          <div class="text-left">
            <label class="block text-sm font-medium text-blue-700 mb-1">إجمالي الدرجات</label>
            <input type="number" 
                   id="total-${student.replace(/\s+/g, "-")}" 
                   class="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-center font-bold" 
                   min="0" 
                   placeholder="20">
          </div>
        </div>
      </div>
    `;
    studentsListContainer.appendChild(studentDiv);
  });

  document.getElementById("quickTestsForm").classList.remove("hidden");
  showNotification("تم تحضير نموذج إدخال الدرجات", "success");
}

// وظيفة حفظ جميع درجات الاختبار
function saveAllTestScores() {
  const testType = document.getElementById("quickTestType").value;
  const testName = document.getElementById("quickTestName").value;
  const classSelect = document.getElementById("teacherClassSelect");
  const selectedClass = classSelect.value;

  if (!selectedClass || !classStudents[selectedClass]) {
    showNotification("خطأ في بيانات الصف", "error");
    return;
  }

  let savedCount = 0;

  classStudents[selectedClass].forEach((student) => {
    const scoreInput = document.getElementById(
      `score-${student.replace(/\s+/g, "-")}`
    );
    const totalInput = document.getElementById(
      `total-${student.replace(/\s+/g, "-")}`
    );

    const score = parseInt(scoreInput.value) || 0;
    const total = parseInt(totalInput.value) || 0;

    if (score > 0 && total > 0) {
      // حفظ درجة الاختبار للطالب
      if (!studentTracking[student]) {
        studentTracking[student] = {};
      }
      if (!studentTracking[student].quickTests) {
        studentTracking[student].quickTests = [];
      }

      studentTracking[student].quickTests.push({
        name: testName,
        type: testType,
        score: score,
        total: total,
        percentage: Math.round((score / total) * 100),
        date: new Date().toISOString(),
      });

      savedCount++;
    }
  });

  if (savedCount > 0) {
    showNotification(`تم حفظ درجات ${savedCount} طالب بنجاح!`, "success");
    hideQuickTestsEntry();
  } else {
    showNotification("لم يتم إدخال أي درجات صحيحة", "error");
  }
}

// وظيفة إخفاء نموذج الدرجات السريع
function hideQuickTestsEntry() {
  document.getElementById("quickTestsForm").classList.add("hidden");
  document.getElementById("quickTestName").value = "";
}

// ENHANCED: تحسين وظيفة تحميل خيارات الطلاب للمعلم
function loadTeacherStudentOptions() {
  if (!isAdmin) return;

  const classSelect = document.getElementById("teacherClassSelect");
  const studentSelect = document.getElementById("teacherStudentSelect");

  if (!classSelect || !studentSelect) return;

  // تحديث قائمة الطلاب عند تغيير الصف
  classSelect.addEventListener("change", loadStudentsByClass);
}

// ENHANCED: تحسين وظيفة الإشعارات مع دعم الفلترة
function showNotification(message, type) {
  // إزالة الإشعارات السابقة
  const existingNotifications = document.querySelectorAll(
    ".notification-toast"
  );
  existingNotifications.forEach((notification) => notification.remove());

  const notification = document.createElement("div");
  notification.className = `notification-toast fixed top-4 left-4 z-50 p-4 rounded-2xl shadow-2xl transform transition-all duration-300 translate-x-full max-w-md`;

  // تحديد الألوان حسب النوع
  const colors = {
    success: "bg-emerald-500 text-white border-emerald-600",
    error: "bg-red-500 text-white border-red-600",
    info: "bg-blue-500 text-white border-blue-600",
    warning: "bg-yellow-500 text-white border-yellow-600",
  };

  notification.className += ` ${colors[type] || colors.info} border-2`;

  // تحديد الأيقونة حسب النوع
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.97-.833-2.74 0L4.072 15.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`,
  };

  notification.innerHTML = `
    <div class="flex items-center">
      <div class="flex-shrink-0 ml-3">
        ${icons[type] || icons.info}
      </div>
      <div class="font-medium">
        ${message}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="mr-3 hover:opacity-75">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // إظهار الإشعار
  setTimeout(() => notification.classList.remove("translate-x-full"), 100);

  // إخفاء الإشعار تلقائياً
  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

// New Functions for Madrasati Platform
function showMadrasatiGuide() {
  document.getElementById("madrasatiGuide").classList.remove("hidden");
  document
    .getElementById("madrasatiGuide")
    .scrollIntoView({ behavior: "smooth" });
}

function hideMadrasatiGuide() {
  document.getElementById("madrasatiGuide").classList.add("hidden");
}

// ENHANCED: تحسين وظيفة تسجيل الدخول مع تطبيق الفلترة التلقائية
function showLoginModal() {
  document.getElementById("loginModal").classList.remove("hidden");
}

function hideLoginModal() {
  document.getElementById("loginModal").classList.add("hidden");
  // Clear form
  document.getElementById("username").value = "";
  document.getElementById("userCode").value = "";
  document.getElementById("adminCode").value = "";
}

function login() {
  const username = document.getElementById("username").value;
  const userCode = document.getElementById("userCode").value;
  const adminCode = document.getElementById("adminCode").value;

  if (!username) {
    showNotification("يرجى إدخال اسم المستخدم", "error");
    return;
  }

  // Check if admin
  if (adminCode === ADMIN_CODE) {
    isAdmin = true;
    currentUser = { name: username, role: "admin" };
    document.getElementById("adminPanelBtn").classList.remove("hidden");

    // Update UI with compact design
    document.getElementById(
      "userNameDisplay"
    ).textContent = `${username} (معلم)`;
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("user Info").classList.add("flex");
    document.getElementById("loginBtn").classList.add("hidden");

    // Show admin sections
    checkAdminSections();

    hideLoginModal();
    showNotification("مرحباً بك في لوحة التحكم!");

    // ENHANCED: تطبيق الفلترة التلقائية للمعلم
    setTimeout(() => {
      applyUserBasedFiltering();
    }, 100);

    return;
  }

  // Check student codes
  if (!userCode) {
    showNotification("يرجى إدخال كود الطالب", "error");
    return;
  }

  if (studentCodes[username] && studentCodes[username].code === userCode) {
    isAdmin = false;
    currentUser = {
      name: username,
      role: "student",
      class: studentCodes[username].class,
    };
    document.getElementById("studentErrorsBtn").classList.remove("hidden");

    // Initialize student errors if not exists
    if (!studentErrors[username]) {
      studentErrors[username] = [];
    }

    // Update UI with compact design
    document.getElementById("userNameDisplay").textContent = username;
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("userInfo").classList.add("flex");
    document.getElementById("loginBtn").classList.add("hidden");

    hideLoginModal();
    showNotification(`أهلاً وسهلاً ${username}!`);

    // Update upload limit display for logged in student
    updateUploadLimitDisplay();

    // ENHANCED: تطبيق الفلترة التلقائية للطالب
    setTimeout(() => {
      applyUserBasedFiltering();
    }, 100);
  } else {
    showNotification("اسم المستخدم أو الكود غير صحيح", "error");
  }
}

function logout() {
  isAdmin = false;
  currentUser = null;
  isEditing = false;
  editingExamId = null;
  currentExamData = null;
  examSaveInProgress = false; // FIXED: Reset save progress flag
  saveAttempts = 0; // FIXED: Reset save attempts
  lastSaveTime = 0; // FIXED: Reset last save time

  // Update UI
  document.getElementById("userInfo").classList.add("hidden");
  document.getElementById("userInfo").classList.remove("flex");
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("adminPanelBtn").classList.add("hidden");
  document.getElementById("studentErrorsBtn").classList.add("hidden");

  // Hide admin sections
  const teacherUploadSection = document.getElementById("teacherUploadSection");
  const teacherWeeklyPlanSection = document.getElementById(
    "teacherWeeklyPlanSection"
  );
  const teacherPhotoSection = document.getElementById("teacherPhotoSection");
  const teacherReviewSection = document.getElementById("teacherReviewSection");
  const designControls = document.getElementById("designControls");

  if (teacherUploadSection) teacherUploadSection.classList.add("hidden");
  if (teacherWeeklyPlanSection)
    teacherWeeklyPlanSection.classList.add("hidden");
  if (teacherPhotoSection) teacherPhotoSection.classList.add("hidden");
  if (teacherReviewSection) teacherReviewSection.classList.add("hidden");
  if (designControls) designControls.classList.add("hidden");

  // ENHANCED: إعادة تعيين الفلترة للوضع العام
  currentClass = "all";
  currentPhotoFilter = "all";

  // إزالة معلومات الصف للطالب
  const studentClassInfo = document.getElementById("studentClassInfo");
  if (studentClassInfo) {
    studentClassInfo.remove();
  }

  // إظهار عناصر الفلترة مرة أخرى
  showClassFilterControls(true);

  // Go to home
  showSection("home");
  showNotification("تم تسجيل الخروج بنجاح. نراك قريباً!");

  // تطبيق الفلترة العامة
  setTimeout(() => {
    filterContentByClass();
  }, 100);
}

// FIXED: Enhanced Notification system with proper CSS classes
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  if (!notification || !notificationText) return;

  notificationText.textContent = message;

  // FIXED: Remove all previous notification classes
  notification.className =
    "fixed top-4 right-4 text-white px-8 py-4 rounded-xl shadow-2xl transform transition-transform duration-300 flex items-center z-50 max-w-md";

  // Set style based on type
  if (type === "error") {
    notification.classList.add("notification-error");
  } else if (type === "warning") {
    notification.classList.add("notification-warning");
  } else if (type === "info") {
    notification.classList.add("notification-info");
  } else {
    notification.classList.add("notification-success");
  }

  // Show notification
  notification.classList.remove("translate-y-[-100px]", "opacity-0");
  notification.classList.add("translate-y-0", "opacity-100");

  // Hide after 4 seconds
  setTimeout(() => {
    notification.classList.add("translate-y-[-100px]", "opacity-0");
    notification.classList.remove("translate-y-0", "opacity-100");
  }, 4000);
}

// Load latest reminders for home page
function loadLatestReminders() {
  const container = document.getElementById("latestReminders");
  container.innerHTML = "";

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 21l-.707-.707L18.828 5l.707.707L4.828 21zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg">لا توجد تذكيرات حالياً</p>
        <p class="text-sm text-gray-400 mt-2">سيتم إضافة التذكيرات من قبل المعلم</p>
      </div>
    `;
    return;
  }

  // ENHANCED: فلترة التذكيرات للطلاب
  let filteredReminders = reminders;

  if (!isAdmin && currentUser && currentUser.class) {
    filteredReminders = reminders.filter(
      (reminder) =>
        reminder.classes.includes(currentUser.class) ||
        reminder.classes.includes("all")
    );
  }

  const latest = filteredReminders.slice(0, 3);

  if (latest.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 21l-.707-.707L18.828 5l.707.707L4.828 21zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg">
          ${
            !isAdmin && currentUser
              ? `لا توجد تذكيرات لصف ${getClassNameArabic(
                  currentUser.class
                )} حالياً`
              : "لا توجد تذكيرات حالياً"
          }
        </p>
        <p class="text-sm text-gray-400 mt-2">سيتم إضافة التذكيرات من قبل المعلم</p>
      </div>
    `;
    return;
  }

  latest.forEach((reminder) => {
    const typeIcons = {
      new: "🔔",
      important: "⚠️",
      urgent: "🚨",
    };

    const typeColors = {
      new: "from-blue-500 to-blue-600",
      important: "from-green-500 to-green-600",
      urgent: "from-red-500 to-red-600",
    };

    const reminderHtml = `
            <div class="flex">
                <div class="bg-gradient-to-r ${
                  typeColors[reminder.type]
                } rounded-full p-4 ml-4 animate-bounce-gentle">
                    <span class="text-2xl">${typeIcons[reminder.type]}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold gradient-text text-xl">${
                      reminder.title
                    }</h4>
                    <p class="text-gray-600 text-lg mt-2 leading-relaxed">${reminder.content.substring(
                      0,
                      150
                    )}...</p>
                    <p class="text-gray-500 text-sm mt-3 flex items-center">
                        📅 ${reminder.date}
                    </p>
                </div>
            </div>
        `;
    container.innerHTML += reminderHtml;
  });
}

// Add event listeners for file uploads
document.addEventListener("DOMContentLoaded", function () {
  // Worksheet upload area click handler
  const worksheetUploadArea = document.getElementById("worksheetUploadArea");
  if (worksheetUploadArea) {
    worksheetUploadArea.addEventListener("click", function () {
      document.getElementById("worksheetFile").click();
    });
  }

  // Plan upload area click handler
  const planUploadArea = document.getElementById("planUploadArea");
  if (planUploadArea) {
    planUploadArea.addEventListener("click", function () {
      document.getElementById("planFile").click();
    });
  }

  // Photo upload area click handler
  const photoUploadArea = document.getElementById("photoUploadArea");
  if (photoUploadArea) {
    photoUploadArea.addEventListener("click", function () {
      document.getElementById("achievementPhoto").click();
    });
  }

  // Achievement file upload area click handler
  const achievementFileUploadArea = document.getElementById(
    "achievementFileUploadArea"
  );
  if (achievementFileUploadArea) {
    achievementFileUploadArea.addEventListener("click", function () {
      if (
        !document.getElementById("filePreviewArea").classList.contains("hidden")
      ) {
        return; // Don't trigger if preview is showing
      }
      document.getElementById("achievementFileInput").click();
    });
  }

  // Load custom design image if exists
  const customDesignImage = localStorage.getItem("customDesignImage");
  if (customDesignImage) {
    const designPreview = document.querySelector(".design-preview");
    if (designPreview) {
      designPreview.src = customDesignImage;
    }
  }
});

// Force cache refresh on page load
window.addEventListener("beforeunload", function () {
  // Clear any cached data
  if ("caches" in window) {
    caches.keys().then(function (names) {
      names.forEach(function (name) {
        caches.delete(name);
      });
    });
  }
});

// Prevent back/forward cache
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

// إغلاق القائمة عند النقر خارجها
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("classDropdownButton");
  const menu = document.getElementById("classDropdownMenu");
  const arrow = document.getElementById("dropdownArrow");

  if (
    dropdown &&
    menu &&
    arrow &&
    !dropdown.contains(event.target) &&
    !menu.contains(event.target)
  ) {
    menu.classList.remove("show");
    arrow.style.transform = "rotate(0deg)";
  }
});

// ===== إدارة الجلسة وحفظ الحالة - نسخة محسنة بدون تعارضات =====

// حفظ حالة المستخدم والقسم الحالي
function saveUserSession() {
  if (!currentUser) return; // لا نحفظ إذا لم يكن هناك مستخدم

  const sessionData = {
    isLoggedIn: currentUser !== null,
    currentUser: currentUser,
    isAdmin: isAdmin,
    currentSection: getCurrentActiveSection(),
    timestamp: Date.now(),
    // حفظ بيانات إضافية
    selectedClass: currentClass,
    zoomLevel: zoomLevel,
    currentPhotoFilter: currentPhotoFilter,
  };

  localStorage.setItem("userSession", JSON.stringify(sessionData));
}

// استرجاع حالة المستخدم المحفوظة
function loadUserSession() {
  try {
    const savedSession = localStorage.getItem("userSession");
    if (!savedSession) return null;

    const sessionData = JSON.parse(savedSession);

    // التحقق من صحة الجلسة (لا تزيد عن 24 ساعة)
    const sessionAge = Date.now() - sessionData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة

    if (sessionAge > maxAge) {
      localStorage.removeItem("userSession");
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("خطأ في تحميل الجلسة:", error);
    localStorage.removeItem("userSession");
    return null;
  }
}

// الحصول على القسم النشط حالياً
function getCurrentActiveSection() {
  const activeSection = document.querySelector(".section.active");
  return activeSection ? activeSection.id : "home";
}

// استرجاع الجلسة عند تحميل الصفحة
function restoreUserSession() {
  const session = loadUserSession();

  if (session && session.isLoggedIn && session.currentUser) {
    // استرجاع بيانات المستخدم
    currentUser = session.currentUser;
    isAdmin = session.isAdmin;
    currentClass = session.selectedClass || "all";
    zoomLevel = session.zoomLevel || 1;
    currentPhotoFilter = session.currentPhotoFilter || "all";

    // تحديث واجهة المستخدم
    updateUIAfterLogin();

    // استرجاع القسم المحفوظ (تجنب استرجاع قسم الاختبارات إذا كان هناك اختبار جاري)
    if (
      session.currentSection &&
      session.currentSection !== "home" &&
      session.currentSection !== "examTaking" &&
      session.currentSection !== "examResults" &&
      session.currentSection !== "examEditor"
    ) {
      setTimeout(() => {
        showSection(session.currentSection);
      }, 100);
    }

    console.log(`تم استرجاع جلسة المستخدم: ${currentUser.name}`);
  }
}

// تحديث واجهة المستخدم بعد تسجيل الدخول
function updateUIAfterLogin() {
  if (!currentUser) return;

  // إظهار معلومات المستخدم
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userInfo = document.getElementById("userInfo");
  const loginBtn = document.getElementById("loginBtn");

  if (userNameDisplay && userInfo && loginBtn) {
    userNameDisplay.textContent = isAdmin
      ? `${currentUser.name} (معلم)`
      : currentUser.name;
    userInfo.classList.remove("hidden");
    userInfo.classList.add("flex");
    loginBtn.classList.add("hidden");
  }

  // إظهار الأزرار المناسبة
  if (isAdmin) {
    const adminPanelBtn = document.getElementById("adminPanelBtn");
    if (adminPanelBtn) adminPanelBtn.classList.remove("hidden");
    if (typeof checkAdminSections === "function") {
      checkAdminSections();
    }
  } else {
    const studentErrorsBtn = document.getElementById("studentErrorsBtn");
    if (studentErrorsBtn) studentErrorsBtn.classList.remove("hidden");

    // تحديث عرض حدود الرفع للطلاب
    if (typeof updateUploadLimitDisplay === "function") {
      updateUploadLimitDisplay();
    }
  }

  // تحديث مستوى التكبير
  if (typeof updateZoomLevel === "function") {
    updateZoomLevel();
  }

  // ENHANCED: تطبيق الفلترة التلقائية بعد استرجاع الجلسة
  setTimeout(() => {
    applyUserBasedFiltering();
  }, 200);
}

// حفظ الجلسة عند تغيير القسم (بدون تعارض)
function saveSessionOnSectionChange(sectionName) {
  if (currentUser && sectionName) {
    // لا نحفظ الجلسة إذا كان المستخدم في وسط اختبار
    if (sectionName === "examTaking" || sectionName === "examResults") {
      return;
    }
    saveUserSession();
  }
}

// مسح الجلسة عند تسجيل الخروج
function clearUserSession() {
  localStorage.removeItem("userSession");
}

// حفظ الجلسة بشكل دوري (كل دقيقة بدلاً من 30 ثانية لتقليل الحمل)
function startSessionAutoSave() {
  setInterval(() => {
    if (currentUser && !examTimer) {
      // لا نحفظ أثناء الاختبار
      saveUserSession();
    }
  }, 60000); // دقيقة واحدة
}

// ===== تحسين معالجة الأحداث =====

// حفظ الجلسة عند إغلاق الصفحة (بدون تعارض مع الاختبارات)
window.addEventListener("beforeunload", function (event) {
  if (currentUser && !examTimer) {
    // لا نحفظ إذا كان هناك اختبار جاري
    saveUserSession();
  }
  // لا نتدخل في معالجة الاختبارات الأصلية
});

// حفظ الجلسة عند تغيير الرؤية (تبديل التبويبات)
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden" && currentUser && !examTimer) {
    saveUserSession();
  }
});

// ===== تحسين التكامل مع الوظائف الموجودة =====

// إضافة معالج للحفظ بعد تسجيل الدخول الناجح
function enhanceLoginFunction() {
  // البحث عن وظيفة تسجيل الدخول الأصلية
  const originalLoginBtn = document.getElementById("loginBtn");
  if (originalLoginBtn) {
    originalLoginBtn.addEventListener("click", function () {
      // انتظار قصير للتأكد من اكتمال تسجيل الدخول
      setTimeout(() => {
        if (currentUser) {
          saveUserSession();
          showNotification("تم حفظ جلستك بنجاح", "success");
        }
      }, 500);
    });
  }
}

// إضافة معالج لحفظ الجلسة عند تغيير الأقسام
function enhanceSectionNavigation() {
  // مراقبة تغيير الأقسام
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        if (
          target.classList.contains("section") &&
          target.classList.contains("active")
        ) {
          saveSessionOnSectionChange(target.id);
        }
      }
    });
  });

  // مراقبة جميع الأقسام
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    observer.observe(section, { attributes: true });
  });
}

// إضافة معالج لمسح الجلسة عند تسجيل الخروج
function enhanceLogoutFunction() {
  const logoutBtn = document.querySelector('[onclick*="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      clearUserSession();
      showNotification("تم مسح جلستك المحفوظة", "info");
    });
  }
}

// ===== حماية خاصة لقسم الاختبارات =====

// منع حفظ الجلسة أثناء الاختبارات
function protectExamSessions() {
  // مراقبة بداية الاختبار
  const originalStartExam = window.startExam;
  if (typeof originalStartExam === "function") {
    window.startExam = function (examId) {
      // تعطيل حفظ الجلسة التلقائي أثناء الاختبار
      console.log("🔒 تم تعطيل حفظ الجلسة أثناء الاختبار");
      return originalStartExam.call(this, examId);
    };
  }

  // مراقبة انتهاء الاختبار
  const originalFinishExam = window.finishExam;
  if (typeof originalFinishExam === "function") {
    window.finishExam = function () {
      const result = originalFinishExam.call(this);
      // إعادة تفعيل حفظ الجلسة بعد انتهاء الاختبار
      setTimeout(() => {
        if (currentUser) {
          saveUserSession();
          console.log("✅ تم إعادة تفعيل حفظ الجلسة بعد الاختبار");
        }
      }, 1000);
      return result;
    };
  }
}

// ===== التهيئة المحسنة =====

// تشغيل النظام بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {
  // انتظار أطول للتأكد من تحميل جميع الوظائف الأصلية
  setTimeout(() => {
    restoreUserSession();
    startSessionAutoSave();
    enhanceLoginFunction();
    enhanceSectionNavigation();
    enhanceLogoutFunction();
    protectExamSessions();

    console.log("✅ تم تحميل نظام إدارة الجلسة المحسن بنجاح");
  }, 1000);
});

// استرجاع الجلسة عند العودة للصفحة من التاريخ
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    setTimeout(() => {
      restoreUserSession();
    }, 200);
  }
});

// إضافة وظيفة لإعادة تعيين الجلسة يدوياً (للطوارئ)
window.resetUserSession = function () {
  clearUserSession();
  currentUser = null;
  isAdmin = false;
  location.reload();
};

console.log("🔧 نظام إدارة الجلسة المحسن جاهز للاستخدام");
console.log("🎯 نظام الفلترة الذكي جاهز للاستخدام");
