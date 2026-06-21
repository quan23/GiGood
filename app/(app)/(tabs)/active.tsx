import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReportConfirm } from "@/components/modals/ReportConfirm";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import { useUi } from "@/hooks/useUi";
import type { Job } from "@/types";

export default function ActiveScreen() {
  const { state } = useGiGood();
  const { confirmCompleted, reportCompleted } = useJobs();
  const { showToast } = useUi();
  const [reportJob, setReportJob] = useState<Job | null>(null);
  const active = state.data.jobs.filter(j => j.status === "assigned");
  const role = state.auth.currentRole;

  const handleComplete = (jobId: number) => {
    if (role === "tasker") {
      const job = state.data.jobs.find(j => j.id === jobId) ?? null;
      setReportJob(job);
    } else {
      const job = state.data.jobs.find(j => j.id === jobId);
      if (!job) return;
      confirmCompleted(jobId, job.budget);
      showToast("Xác nhận hoàn thành! Tiền đã được giải phóng.", "success");
    }
  };

  const handleReportConfirm = () => {
    if (!reportJob) return;
    reportCompleted(reportJob.id);
    showToast("Đã báo hoàn thành! Chờ chủ việc xác nhận.", "info");
    setReportJob(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Đang làm</Text>
        <Text className="text-gray-500 text-sm">{active.length} việc đang thực hiện</Text>
      </View>
      {active.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="Chưa có việc nào"
          subtitle={role === "tasker" ? "Nhận việc từ bảng việc để bắt đầu" : "Bạn chưa có việc nào đang thực hiện"}
        />
      ) : (
        <FlatList
          data={active}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="pb-4"
          renderItem={({ item }) => (
            <JobCard
              job={item}
              actionLabel={item.isCompletedReportedByTasker ? "Chờ xác nhận" : "Hoàn thành"}
              onAction={item.isCompletedReportedByTasker ? undefined : () => handleComplete(item.id)}
            />
          )}
        />
      )}
      <ReportConfirm
        visible={reportJob !== null}
        job={reportJob}
        onConfirm={handleReportConfirm}
        onCancel={() => setReportJob(null)}
      />
    </SafeAreaView>
  );
}
