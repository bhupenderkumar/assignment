// src/components/pages/ManagementPage.tsx
import { motion } from 'framer-motion';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentManagementList from '../admin/AssignmentManagementList';
import Layout from '../layout/Layout';

interface ManagementPageProps {
  onEdit: (assignment: InteractiveAssignment) => void;
  onShare: (assignment: InteractiveAssignment) => void;
}

const ManagementPage = ({ onEdit, onShare }: ManagementPageProps) => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <motion.div
          key="management-page"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-6">Manage Assignments</h1>
          <AssignmentManagementList onEdit={onEdit} onShare={onShare} />
        </motion.div>
      </div>
    </Layout>
  );
};

export default ManagementPage;
