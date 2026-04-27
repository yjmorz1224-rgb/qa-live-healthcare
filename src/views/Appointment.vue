<template>
  <div class="appointment">
    <div class="appointment-container">

      <!-- ==================== 身份验证区 ==================== -->
      <div v-if="!currentPatient" class="auth-section">
        <div class="auth-card">
          <h1>预约挂号</h1>
          <p>请先验证您的身份以进行预约</p>

          <a-form
            :model="authForm"
            :rules="authRules"
            @finish="handleVerifyPatient"
            layout="vertical"
          >
            <a-form-item label="姓名" name="name">
              <a-input
                v-model:value="authForm.name"
                size="large"
                placeholder="请输入您的姓名"
              >
                <template #prefix><UserOutlined /></template>
              </a-input>
            </a-form-item>

            <a-form-item label="生日" name="birthday">
              <a-date-picker
                v-model:value="authForm.birthday"
                size="large"
                format="YYYY-MM-DD"
                placeholder="请选择您的生日"
                style="width: 100%"
              />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" size="large" block>
                验证身份并预约
              </a-button>
            </a-form-item>
          </a-form>

          <a-alert
            message="提示"
            description="输入任意姓名和生日即可使用。首次输入会自动创建账户,再次输入相同信息即可登录。"
            type="info"
            show-icon
          />
        </div>
      </div>

      <!-- ==================== 预约主界面 ==================== -->
      <template v-else>
        <!-- 头部：患者信息栏 -->
        <div class="appt-header">
          <div class="patient-info">
            <CalendarOutlined class="header-icon" />
            <div>
              <h1>{{ currentPatient.name }} 的预约</h1>
              <p>在线预约挂号 — 选择医生和就诊时间</p>
            </div>
          </div>
          <a-button @click="handleLogout">
            <LogoutOutlined /> 切换用户
          </a-button>
        </div>

        <!-- 步骤 1: 选择医生 -->
        <div class="step-section">
          <h2 class="step-title">
            <span class="step-num">1</span> 选择医生
          </h2>
          <p v-if="!selectedDoctor" class="step-hint">点击选择您要预约的医生</p>

          <div v-if="activeDoctors.length === 0" class="empty-doctors">
            <a-empty description="暂无可用医生" />
          </div>

          <div v-else class="doctor-grid">
            <div
              v-for="doctor in activeDoctors"
              :key="doctor.id"
              class="doctor-card"
              :class="{ 'doctor-selected': selectedDoctor?.id === doctor.id }"
              @click="selectDoctor(doctor)"
            >
              <img :src="doctor.avatar" :alt="doctor.name" class="doctor-avatar" />
              <div class="doctor-info">
                <h3>{{ doctor.name }}</h3>
                <p class="doctor-title">{{ doctor.title }} · {{ doctor.department }}</p>
                <p class="doctor-exp">{{ doctor.experience }}</p>
              </div>
              <CheckCircleFilled v-if="selectedDoctor?.id === doctor.id" class="check-icon" />
            </div>
          </div>
        </div>

        <!-- 步骤 2: 选择日期和时段（选中医生后显示） -->
        <div v-if="selectedDoctor" class="step-section">
          <h2 class="step-title">
            <span class="step-num">2</span> 选择日期与时段
          </h2>
          <p class="step-hint">当前选择: {{ selectedDoctor.name }} · {{ selectedDoctor.department }}</p>

          <div class="date-picker-wrapper">
            <label class="date-label">就诊日期：</label>
            <a-date-picker
              v-model:value="selectedDate"
              size="large"
              format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              placeholder="请选择就诊日期"
              @change="onDateChange"
            />
          </div>

          <!-- 时段展示区域 -->
          <div v-if="selectedDate && currentDaySchedule" class="slots-area">
            <!-- 上午时段 -->
            <div v-if="morningSlots.length > 0" class="slot-group">
              <h3 class="slot-period"><ClockCircleOutlined /> 上午</h3>
              <div class="slot-list">
                <a-button
                  v-for="slot in morningSlots"
                  :key="slot.key"
                  class="slot-btn"
                  :class="{
                    'slot-selected': selectedSlotKey === slot.key,
                    'slot-disabled': !slot.available,
                  }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot)"
                >
                  <span class="slot-label">{{ slot.label }}</span>
                  <span class="slot-count" :class="{ 'count-full': !slot.available }">
                    {{ slot.available ? `剩余 ${slot.maxCapacity - slot.bookedCount}/${slot.maxCapacity}` : '已满' }}
                  </span>
                </a-button>
              </div>
            </div>

            <!-- 下午时段 -->
            <div v-if="afternoonSlots.length > 0" class="slot-group">
              <h3 class="slot-period"><ClockCircleOutlined /> 下午</h3>
              <div class="slot-list">
                <a-button
                  v-for="slot in afternoonSlots"
                  :key="slot.key"
                  class="slot-btn"
                  :class="{
                    'slot-selected': selectedSlotKey === slot.key,
                    'slot-disabled': !slot.available,
                  }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot)"
                >
                  <span class="slot-label">{{ slot.label }}</span>
                  <span class="slot-count" :class="{ 'count-full': !slot.available }">
                    {{ slot.available ? `剩余 ${slot.maxCapacity - slot.bookedCount}/${slot.maxCapacity}` : '已满' }}
                  </span>
                </a-button>
              </div>
            </div>

            <a-empty v-if="morningSlots.length === 0 && afternoonSlots.length === 0" description="该日无排班" />
          </div>

          <a-alert v-else-if="!selectedDate" type="warning" show-icon message="请先选择就诊日期" />

          <!-- 已选时段提示 -->
          <div v-if="selectedSlotKey && selectedDate" class="selected-slot-info">
            <a-tag color="blue" style="font-size: 14px; padding: 4px 12px;">
              已选: {{ formatDate(selectedDate) }} {{ selectedSlotLabel }}
            </a-tag>
          </div>
        </div>

        <!-- 步骤 3: 填写症状并提交（选中时段后显示） -->
        <div v-if="selectedSlotKey" class="step-section submit-section">
          <h2 class="step-title">
            <span class="step-num">3</span> 描述症状并提交
          </h2>

          <div class="symptom-form">
            <a-textarea
              v-model:value="symptomText"
              :rows="5"
              :maxlength="500"
              show-count
              placeholder="请详细描述您的症状或不适感，以便医生更好地为您服务..."
              size="large"
            />

            <div class="submit-actions">
              <a-alert
                v-if="!canSubmit"
                :message="submitBlockReason"
                type="error"
                show-icon
                style="margin-bottom: 16px;"
              />
              <a-button
                type="primary"
                size="large"
                :loading="submitting"
                :disabled="submitting || !canSubmit"
                block
                @click="handleSubmitAppointment"
              >
                <CalendarOutlined /> 确认提交预约
              </a-button>
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== 成功弹窗 ==================== -->
      <a-modal
        v-model:open="successModalVisible"
        title="预约成功！"
        :footer="null"
        width="520px"
        centered
      >
        <div class="success-content">
          <a-result
            status="success"
            title="预约申请已提交"
            sub-title="您的预约已创建，等待医生确认后即可完成预约"
          >
            <template #extra>
              <div class="result-details">
                <a-descriptions :column="1" bordered size="small">
                  <a-descriptions-item label="预约编号">{{ resultAppt?.id || '-' }}</a-descriptions-item>
                  <a-descriptions-item label="医生">{{ resultAppt?.doctorName || '-' }}</a-descriptions-item>
                  <a-descriptions-item label="科室">{{ resultAppt?.department || '-' }}</a-descriptions-item>
                  <a-descriptions-item label="就诊日期">{{ resultAppt?.appointmentDate || '-' }}</a-descriptions-item>
                  <a-descriptions-item label="就诊时段">{{ resultAppt?.timeSlotLabel || '-' }}</a-descriptions-item>
                  <a-descriptions-item label="状态">
                    <a-tag color="orange">待确认</a-tag>
                  </a-descriptions-item>
                </a-descriptions>

                <div class="result-actions">
                  <a-button type="primary" block size="large" @click="goToMyAppointments">
                    查看我的预约
                  </a-button>
                  <a-button block size="large" @click="continueBooking" style="margin-top: 8px;">
                    继续预约其他医生
                  </a-button>
                </div>
              </div>
            </template>
          </a-result>
        </div>
      </a-modal>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import {
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
} from '@ant-design/icons-vue';
import { store, Doctor, Appointment, SlotInfo } from '../store';

const router = useRouter();

// ===== 身份验证相关 =====
const currentPatient = computed(() => store.state.currentPatient);

const authForm = reactive({
  name: '',
  birthday: null as Dayjs | null,
});

const authRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  birthday: [{ required: true, message: '请选择生日', trigger: 'change' }],
};

// ===== 医生选择相关 =====
const activeDoctors = computed(() => store.getActiveDoctors());
const selectedDoctor = ref<Doctor | null>(null);

// ===== 日期/时段选择相关 =====
const selectedDate = ref<Dayjs | null>(null);
const selectedSlotKey = ref<string>('');
const selectedSlotLabel = ref<string>('');

// 当天排班数据（根据选中的医生+日期动态计算）
const currentDaySchedule = computed(() => {
  if (!selectedDoctor.value || !selectedDate.value) return null;
  const dateStr = selectedDate.value.format('YYYY-MM-DD');
  const schedule = store.getDoctorSchedule(selectedDoctor.value.id, 7);
  return schedule.find(s => s.date === dateStr) || null;
});

// 上午时段
const morningSlots = computed<SlotInfo[]>(() => {
  if (!currentDaySchedule.value) return [];
  return currentDaySchedule.value.timeSlots.filter(s => s.period === 'morning');
});

// 下午时段
const afternoonSlots = computed<SlotInfo[]>(() => {
  if (!currentDaySchedule.value) return [];
  return currentDaySchedule.value.timeSlots.filter(s => s.period === 'afternoon');
});

// ===== 症状/提交相关 =====
const symptomText = ref('');
const submitting = ref(false);
const successModalVisible = ref(false);
const resultAppt = ref<Appointment | null>(null);

// 表单完整性校验
const canSubmit = computed(() => {
  return (
    selectedDoctor.value !== null &&
    selectedDate.value !== null &&
    selectedSlotKey.value !== '' &&
    symptomText.value.trim().length >= 5
  );
});

const submitBlockReason = computed(() => {
  if (!selectedDoctor.value) return '请先选择医生';
  if (!selectedDate.value) return '请先选择就诊日期';
  if (!selectedSlotKey.value) return '请选择就诊时段';
  if ((symptomText.value || '').trim().length < 5) return '症状描述至少需要5个字符';
  return '';
});

// ========== 方法 ==========

/** 身份验证 */
const handleVerifyPatient = () => {
  const birthday = authForm.birthday?.format('YYYY-MM-DD');
  if (!birthday) {
    message.error('请选择生日');
    return;
  }
  store.verifyPatient(authForm.name.trim(), birthday);
  message.success('验证成功！');
};

/** 登出切换用户 */
const handleLogout = () => {
  store.logoutPatient();
  // 重置所有表单状态
  selectedDoctor.value = null;
  selectedDate.value = null;
  selectedSlotKey.value = '';
  selectedSlotLabel.value = '';
  symptomText.value = '';
  authForm.name = '';
  authForm.birthday = null;
  message.success('已切换用户');
};

/** 选择医生 */
const selectDoctor = (doctor: Doctor) => {
  if (selectedDoctor.value?.id === doctor.id) {
    // 取消选中
    selectedDoctor.value = null;
    resetDateAndSlot();
    return;
  }

  selectedDoctor.value = doctor;
  resetDateAndSlot();
  message.success(`已选择 ${doctor.name} 医生`);
};

/** 重置日期和时段选择 */
const resetDateAndSlot = () => {
  selectedDate.value = null;
  selectedSlotKey.value = '';
  selectedSlotLabel.value = '';
};

/** 日期禁用逻辑：排除周末 + 超过7天的未来日期 */
const disabledDate = (current: Dayjs): boolean => {
  // 今天之前的不可选
  if (current.isBefore(dayjs(), 'day')) return true;
  // 超过7天后不可选
  if (current.isAfter(dayjs().add(7, 'day'), 'day')) return true;
  // 周末不可选 (0=周日, 6=周六)
  const dow = current.day();
  return dow === 0 || dow === 6;
};

/** 日期变更回调 */
const onDateChange = (_date: Dayjs | null) => {
  selectedSlotKey.value = '';
  selectedSlotLabel.value = '';
};

/** 选择时段 */
const selectSlot = (slot: SlotInfo) => {
  if (!slot.available) {
    message.warning('该时段已约满，请选择其他时段');
    return;
  }
  selectedSlotKey.value = slot.key;
  selectedSlotLabel.value = slot.label;
};

/** 格式化日期展示 */
const formatDate = (d: Dayjs): string => d.format('YYYY年MM月DD日');

/** 提交预约 */
const handleSubmitAppointment = async () => {
  if (!canSubmit.value) {
    message.warning(submitBlockReason.value);
    return;
  }

  submitting.value = true;

  try {
    // 模拟网络延迟 500ms（与现有 Question 提交保持一致）
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!selectedDoctor.value || !selectedDate.value || !currentPatient.value) {
      throw new Error('缺少必要信息');
    }

    const appointment = store.createAppointment({
      patientId: currentPatient.value.id,
      patientName: currentPatient.value.name,
      doctorId: selectedDoctor.value.id,
      doctorName: selectedDoctor.value.name,
      department: selectedDoctor.value.department,
      appointmentDate: selectedDate.value.format('YYYY-MM-DD'),
      timeSlot: selectedSlotKey.value,
      timeSlotLabel: selectedSlotLabel.value,
      symptoms: symptomText.value,
    });

    if (appointment) {
      resultAppt.value = appointment;
      successModalVisible.value = true;

      // 重置表单（保留医生和患者状态）
      symptomText.value = '';
      resetDateAndSlot();
    } else {
      message.error('该时段已约满，请选择其他时段');
    }
  } catch (err: any) {
    console.error('预约失败:', err);
    message.error(err.message || '预约失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

/** 跳转到「我的预约」Tab */
const goToMyAppointments = () => {
  successModalVisible.value = false;
  router.push({ path: '/consultation', query: { tab: 'appointments' } });
};

/** 继续预约其他医生 */
const continueBooking = () => {
  successModalVisible.value = false;
  resetDateAndSlot();
};
</script>

<style scoped>
.appointment {
  min-height: calc(100vh - 64px);
  padding-top: 64px;
  background: #f0f2f5;
}

.appointment-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ===== 身份验证区 ===== */
.auth-section {
  min-height: calc(100vh - 112px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.auth-card h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
  text-align: center;
  margin-bottom: 8px;
}

.auth-card > p {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 32px;
}

/* ===== 头部 ===== */
.appt-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px 12px 0 0;
  color: #fff;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.9);
}

.patient-info h1 {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.patient-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* ===== 步骤区域通用 ===== */
.step-section {
  background: #fff;
  padding: 24px 28px;
  border-bottom: 1px solid #f0f0f0;
}

.step-section:last-of-type {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border-bottom: none;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
}

.step-hint {
  font-size: 14px;
  color: #999;
  margin: 0 0 20px;
}

/* ===== 医生网格 ===== */
.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.empty-doctors {
  padding: 32px;
  text-align: center;
}

.doctor-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fafafa;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.doctor-card:hover {
  border-color: #91caff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.doctor-card.doctor-selected {
  border-color: #1890ff;
  background: #e6f4ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.25);
}

.doctor-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.doctor-info {
  flex: 1;
  min-width: 0;
}

.doctor-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.doctor-title {
  font-size: 13px;
  color: #666;
  margin: 0 0 2px;
}

.doctor-exp {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.check-icon {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 20px;
  color: #1890ff;
}

/* ===== 日期选择器 ===== */
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
  white-space: nowrap;
}

/* ===== 时段区域 ===== */
.slots-area {
  margin-top: 8px;
}

.slot-group {
  margin-bottom: 20px;
}

.slot-period {
  font-size: 15px;
  font-weight: 600;
  color: #444;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.slot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.slot-btn {
  min-width: 140px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s ease;
}

.slot-btn:hover:not(.slot-disabled):not(.slot-selected) {
  border-color: #1890ff;
  color: #1890ff;
}

.slot-btn.slot-selected {
  border-color: #1890ff;
  background: #e6f4ff;
  color: #1890ff;
  font-weight: 600;
}

.slot-btn.slot-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #bfbfbf;
}

.slot-label {
  font-size: 13px;
  font-weight: 500;
}

.slot-count {
  font-size: 11px;
  color: #52c41a;
}

.slot-count.count-full {
  color: #ff4d4f;
}

.selected-slot-info {
  margin-top: 16px;
  text-align: center;
}

/* ===== 提交区域 ===== */
.submit-section {
  background: #fafafa;
}

.symptom-form {
  max-width: 700px;
}

.submit-actions {
  margin-top: 20px;
}

/* ===== 成功弹窗 ===== */
.success-content {
  padding: 8px 0;
}

.result-details {
  text-align: left;
  padding: 16px 0;
}

.result-actions {
  margin-top: 24px;
  padding-top: 16px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .auth-card {
    margin: 16px;
    padding: 32px 24px;
  }

  .appt-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .doctor-grid {
    grid-template-columns: 1fr;
  }

  .slot-btn {
    min-width: 110px;
  }

  .date-picker-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
