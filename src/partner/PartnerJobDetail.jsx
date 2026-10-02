import { useEffect, useState } from "react";
import { useParams,Link } from "react-router";
import api from "../api/axios";
import JobDetailsForm from "../jobs/JobDetailsForm";
import PhotoUpload from "../jobs/PhotoUpload";
import SubmitSection from "../jobs/SubmitSection";
import JobTimeline from "../jobs/JobTimeline";
import JobSummary from "../jobs/JobSummary";
import { ArrowLeft, Loader2 } from "lucide-react";

const sectionClass = "border-t border-gray-200 pt-5";
const sectionLabelClass = "text-base font-semibold text-black mb-3";

const PartnerJobDetail = () => {
  const { id } = useParams();
  const [jobData, setJobData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/partner/jobs/${id}`);
        setJobData(response.data.jobData);
        setItems(response.data.items);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={32} className="animate-spin text-black" />
      </div>
    );
  }
  if (error) return <div className="p-2 text-red-600">{error}</div>;
  if (!jobData) return <div className="p-2">Job not found</div>;

  const { clientName, clientNumber, clientAddress, clientCity } = jobData;

  return (
    <div className="p-2">
      <Link
        to="/partner/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-bold text-black mb-1">{clientName}</h2>
            <p className="text-sm text-gray-600">
              {clientAddress}, {clientCity}
            </p>
            <p className="text-sm text-gray-600">{clientNumber}</p>
          </div>

          <div className={sectionClass}>
            <JobDetailsForm
              jobData={jobData}
              jobId={id}
              setJobData={setJobData}
              items={items}
              setItems={setItems}
            />
          </div>

          <div className={sectionClass}>
            <h3 className={sectionLabelClass}>Photo upload</h3>
            <PhotoUpload jobId={id} />
          </div>

          <SubmitSection jobData={jobData} jobId={id} setJobData={setJobData} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-4">Progress</p>
            <JobTimeline status={jobData.status} />
          </div>
          <JobSummary jobData={jobData} />
        </div>
      </div>
    </div>
  );
};

export default PartnerJobDetail;
