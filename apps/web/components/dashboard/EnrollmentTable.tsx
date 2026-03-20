type MemberRecord = {
  member_id: string;
  name: string;
  status: string;
  plan: string;
};

const members: MemberRecord[] = [
  { member_id: "M0001", name: "Alicia Brown", status: "Active", plan: "PPO Gold" },
  { member_id: "M0002", name: "Marcus Lee", status: "Terminated", plan: "HMO Silver" },
];

export default function EnrollmentTable() {
  return (
    <section className="rounded border bg-white p-4">
      <h2 className="mb-3 text-xl font-semibold">834 Member Enrollment</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Member ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Plan</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.member_id} className="border-t">
              <td>{member.member_id}</td>
              <td>{member.name}</td>
              <td>{member.status}</td>
              <td>{member.plan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
