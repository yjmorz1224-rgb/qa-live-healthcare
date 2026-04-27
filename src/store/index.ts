import { reactive } from 'vue';
import doctorData from '../data/doctor-user-list.json';
import patientData from '../data/patient-user.json';
import questionData from '../data/question-list.json';
import appointmentData from '../data/appointment-list.json';
import dayjs from 'dayjs';

export interface Doctor {
  id: string;
  username: string;
  password: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  experience: string;
  specialties: string[];
  isActive: boolean;
}

export interface Patient {
  id: string;
  name: string;
  birthday: string;
  phone: string;
  gender: string;
}

export interface Question {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  question: string;
  submitTime: string;
  status: 'pending' | 'answered';
  answer: string | null;
  answerTime: string | null;
}

// ==================== Appointment Types (TASK-002) ====================

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string;   // YYYY-MM-DD
  timeSlot: string;          // 如 "morning-1"
  timeSlotLabel: string;     // 如 "09:00 - 09:30"
  symptoms: string;
  status: AppointmentStatus;
  createdAt: string;         // ISO 格式
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason?: string;
}

export interface CreateAppointmentParams {
  patientId: string; patientName: string; doctorId: string;
  doctorName: string; department: string; appointmentDate: string;
  timeSlot: string; timeSlotLabel: string; symptoms: string;
}

export interface ScheduleDay {
  date: string; weekday: string; isWorkday: boolean; timeSlots: SlotInfo[];
}

export interface SlotInfo { key: string; label: string; period: 'morning' | 'afternoon';
  bookedCount: number; maxCapacity: number; available: boolean; }

export interface TimeSlotTemplate {
  key: string; label: string; period: 'morning' | 'afternoon';
  startHour: number; startMinute: number; endHour: number; endMinute: number;
  maxCapacity: number;
}

interface State {
  doctors: Doctor[];
  patients: Patient[];
  questions: Question[];
  appointments: Appointment[];  // TASK-002
  currentDoctor: Doctor | null;
  currentPatient: Patient | null;
}

const state = reactive<State>({
  doctors: doctorData as Doctor[],
  patients: patientData as Patient[],
  questions: questionData as Question[],
  appointments: appointmentData as Appointment[],  // TASK-002
  currentDoctor: null,
  currentPatient: null,
});

export const store = {
  state,

  loginDoctor(username: string, password: string): Doctor | null {
    const doctor = state.doctors.find(
      d => d.username === username && d.password === password
    );
    if (doctor) {
      state.currentDoctor = doctor;
      return doctor;
    }
    return null;
  },

  logoutDoctor() {
    state.currentDoctor = null;
  },

  verifyPatient(name: string, birthday: string): Patient {
    let patient = state.patients.find(
      p => p.name === name && p.birthday === birthday
    );

    if (!patient) {
      patient = {
        id: `patient${Date.now()}`,
        name,
        birthday,
        phone: '',
        gender: '',
      };
      state.patients.push(patient);
    }

    state.currentPatient = patient;
    return patient;
  },

  logoutPatient() {
    state.currentPatient = null;
  },

  getQuestionsByDoctor(doctorId: string): Question[] {
    return state.questions.filter(q => q.doctorId === doctorId);
  },

  getQuestionsByPatient(patientId: string): Question[] {
    return state.questions.filter(q => q.patientId === patientId);
  },

  addQuestion(question: Omit<Question, 'id' | 'submitTime' | 'status' | 'answer' | 'answerTime'>): Question {
    const newQuestion: Question = {
      ...question,
      id: `q${Date.now()}`,
      submitTime: new Date().toISOString(),
      status: 'pending',
      answer: null,
      answerTime: null,
    };
    state.questions.push(newQuestion);
    return newQuestion;
  },

  answerQuestion(questionId: string, answer: string) {
    const question = state.questions.find(q => q.id === questionId);
    if (question) {
      question.status = 'answered';
      question.answer = answer;
      question.answerTime = new Date().toISOString();
    }
  },

  markQuestionAsAnswered(questionId: string) {
    const question = state.questions.find(q => q.id === questionId);
    if (question) {
      question.status = 'answered';
      question.answer = '已口述解答';
      question.answerTime = new Date().toISOString();
    }
  },

  getDoctorByUsername(username: string): Doctor | undefined {
    return state.doctors.find(d => d.username === username);
  },

  getActiveDoctors(): Doctor[] {
    return state.doctors.filter(d => d.isActive);
  },

  getStatistics() {
    const totalDoctors = state.doctors.length;
    const totalQuestions = state.questions.length;
    const activeSessions = state.questions.filter(q => q.status === 'pending').length;
    const totalSessions = state.doctors.filter(d => d.isActive).length;

    // TASK-002: 追加预约统计字段
    const totalAppointments = state.appointments.length;
    const pendingAppointments = state.appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const todayAppointments = state.appointments.filter(
      a => a.appointmentDate === dayjs().format('YYYY-MM-DD') && a.status !== 'cancelled'
    ).length;

    return {
      totalDoctors,
      totalQuestions,
      activeSessions,
      totalSessions,
      totalAppointments,
      pendingAppointments,
      todayAppointments,
    };
  },

  // ==================== Appointment Methods (TASK-002) ====================

  /** HTML 转义 — 防止 XSS 载荷存储 */
  escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** 安全截断字符串 */
  truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.slice(0, maxLen) : str;
  },

  // --- 基础 CRUD (4) ---

  createAppointment(params: CreateAppointmentParams): Appointment | null {
    // 输入验证与净化 (安全要求 2.4.1)
    if (!params || typeof params !== 'object') return null;

    // symptoms 截断 + HTML 转义
    const safeSymptoms = this.escapeHtml(this.truncate(params.symptoms || '', 500));

    // appointmentDate 格式校验
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.appointmentDate)) return null;
    if (dayjs(params.appointmentDate).isBefore(dayjs(), 'day')) return null;

    // timeSlot 必须匹配模板 key 列表
    const templates = this.getTimeSlotTemplates();
    const validKeys = templates.map(t => t.key);
    if (!validKeys.includes(params.timeSlot)) return null;

    // doctorId 存在性校验
    const doctorExists = state.doctors.some(d => d.id === params.doctorId);
    if (!doctorExists) return null;

    // 二次校验：时段容量检查 (TOCTOU 防护)
    if (this.isTimeSlotFull(params.doctorId, params.appointmentDate, params.timeSlot)) {
      return null; // 时段已满
    }

    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      id: `APT${dayjs().format('YYYYMMDD')}${String(state.appointments.length + 1).padStart(3, '0')}`,
      patientId: params.patientId,
      patientName: params.patientName,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      department: params.department,
      appointmentDate: params.appointmentDate,
      timeSlot: params.timeSlot,
      timeSlotLabel: params.timeSlotLabel,
      symptoms: safeSymptoms,
      status: 'pending',
      createdAt: now,
      confirmedAt: null,
      cancelledAt: null,
      cancelReason: undefined,
    };

    state.appointments.push(newAppointment);
    return newAppointment;
  },

  getAppointmentsByDoctor(doctorId: string): Appointment[] {
    return state.appointments.filter(a => a.doctorId === doctorId);
  },

  getAppointmentsByPatient(patientId: string): Appointment[] {
    return state.appointments.filter(a => a.patientId === patientId);
  },

  getAppointmentById(id: string): Appointment | undefined {
    if (typeof id !== 'string') return undefined;
    return state.appointments.find(a => a.id === id);
  },

  // --- 状态流转 (4) ---

  confirmAppointment(id: string): void {
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) return;
    // 状态机校验：仅允许 pending → confirmed
    if (appt.status !== 'pending') {
      throw new Error('Invalid status transition: confirmAppointment requires pending status');
    }
    appt.status = 'confirmed';
    appt.confirmedAt = new Date().toISOString();
  },

  rejectAppointment(id: string, reason?: string): void {
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) return;
    // 状态机校验：仅允许 pending → cancelled
    if (appt.status !== 'pending') {
      throw new Error('Invalid status transition: rejectAppointment requires pending status');
    }
    appt.status = 'cancelled';
    appt.cancelledAt = new Date().toISOString();
    appt.cancelReason = this.escapeHtml(this.truncate(reason || '', 200));
  },

  cancelAppointment(id: string, _patientId?: string): void {
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) return;

    // 身份校验（防御性检查）
    if (_patientId && appt.patientId !== _patientId) {
      throw new Error('Authorization failed: patient ID mismatch');
    }

    // 状态机校验：仅允许 pending|confirmed → cancelled
    if (appt.status !== 'pending' && appt.status !== 'confirmed') {
      console.warn(`cancelAppointment: invalid current status '${appt.status}' for id=${id}`);
      return;
    }

    // 24h 取消窗口强制执行
    const hoursDiff = dayjs(appt.appointmentDate).diff(dayjs(), 'hour');
    if (hoursDiff < 24) {
      throw new Error('距就诊不足 24 小时，无法取消预约');
    }

    appt.status = 'cancelled';
    appt.cancelledAt = new Date().toISOString();
  },

  completeAppointment(id: string): void {
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) return;
    // 状态机校验：仅允许 confirmed → completed
    if (appt.status !== 'confirmed') {
      throw new Error('Invalid status transition: completeAppointment requires confirmed status');
    }
    appt.status = 'completed';
  },

  // --- 查询辅助 (5) ---

  getAppointmentCountForSlot(doctorId: string, date: string, timeSlot: string): number {
    return state.appointments.filter(
      a => a.doctorId === doctorId
        && a.appointmentDate === date
        && a.timeSlot === timeSlot
        && a.status !== 'cancelled'
    ).length;
  },

  isTimeSlotFull(doctorId: string, date: string, timeSlot: string): boolean {
    const count = this.getAppointmentCountForSlot(doctorId, date, timeSlot);
    return count >= 3; // maxCapacity 固定为 3
  },

  getTodayAppointments(doctorId: string): Appointment[] {
    const today = dayjs().format('YYYY-MM-DD');
    return state.appointments.filter(
      a => a.doctorId === doctorId
        && a.appointmentDate === today
        && a.status !== 'cancelled'
    );
  },

  getPendingAppointments(doctorId: string): Appointment[] {
    return state.appointments.filter(
      a => a.doctorId === doctorId && a.status === 'pending'
    );
  },

  getDoctorSchedule(doctorId: string, days: number = 7): ScheduleDay[] {
    const result: ScheduleDay[] = [];
    const templates = this.getTimeSlotTemplates();

    for (let i = 1; i <= days; i++) {
      const date = dayjs().add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const weekdayNum = date.day(); // 0=Sun, 1=Mon, ..., 6=Sat
      const isWorkday = weekdayNum >= 1 && weekdayNum <= 5; // 周一至周五

      const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const slots: SlotInfo[] = isWorkday
        ? templates.map(t => {
            const bookedCount = this.getAppointmentCountForSlot(doctorId, dateStr, t.key);
            return {
              ...t,
              bookedCount,
              available: bookedCount < t.maxCapacity,
            };
          })
        : [];

      result.push({
        date: dateStr,
        weekday: weekdayNames[weekdayNum],
        isWorkday,
        timeSlots: slots,
      });
    }

    return result;
  },

  // --- 排班模板 (1) ---

  getTimeSlotTemplates(): TimeSlotTemplate[] {
    return [
      { key: 'morning-1', label: '09:00 - 09:30', period: 'morning', startHour: 9, startMinute: 0, endHour: 9, endMinute: 30, maxCapacity: 3 },
      { key: 'morning-2', label: '09:30 - 10:00', period: 'morning', startHour: 9, startMinute: 30, endHour: 10, endMinute: 0, maxCapacity: 3 },
      { key: 'morning-3', label: '10:00 - 10:30', period: 'morning', startHour: 10, startMinute: 0, endHour: 10, endMinute: 30, maxCapacity: 3 },
      { key: 'afternoon-1', label: '14:00 - 14:30', period: 'afternoon', startHour: 14, startMinute: 0, endHour: 14, endMinute: 30, maxCapacity: 3 },
      { key: 'afternoon-2', label: '14:30 - 15:00', period: 'afternoon', startHour: 14, startMinute: 30, endHour: 15, endMinute: 0, maxCapacity: 3 },
      { key: 'afternoon-3', label: '15:00 - 15:30', period: 'afternoon', startHour: 15, startMinute: 0, endHour: 15, endMinute: 30, maxCapacity: 3 },
    ];
  },
};
