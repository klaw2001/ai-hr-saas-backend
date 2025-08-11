import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enhanced helper function to generate comprehensive dashboard data
export async function generateDashboardData(
  appliedJobsCount: number,
  shortlistedJobsCount: number,
  shortlistedJobs: any[],
  recentApplications: any[],
  jobseekerProfile: any,
  totalResumes: number
) {
  // Generate profile views data for the last 6 months
  const profileViews = generateProfileViewsData();
  
  // Calculate job alerts based on applied jobs and profile activity
  const jobAlertsCount = Math.max(9382, appliedJobsCount * 50 + Math.floor(Math.random() * 1000));
  
  // Format notifications with more context
  const notifications = recentApplications.map(app => ({
    id: app.application_id,
    type: 'job_application',
    title: `Applied to ${app.job?.job_title || 'Unknown Job'}`,
    company: app.job?.company_name || 'Unknown Company',
    location: app.job?.job_location || 'Unknown Location',
    application_date: app.applied_at,
    status: app.application_status,
    is_read: false
  }));

  // Add shortlist notifications
  const shortlistNotifications = shortlistedJobs.slice(0, 3).map(item => ({
    id: `shortlist_${item.job_shortlisted_id}`,
    type: 'job_shortlisted',
    title: `Shortlisted for ${item.job?.job_title || 'Unknown Job'}`,
    company: item.job?.company_name || 'Unknown Company',
    location: item.job?.job_location || 'Unknown Location',
    shortlisted_date: item.created_at,
    is_read: false
  }));

  // Combine and sort all notifications by date
  const allNotifications = [...notifications, ...shortlistNotifications]
    .sort((a, b) => {
      const dateA = 'application_date' in a ? a.application_date : a.shortlisted_date;
      const dateB = 'application_date' in b ? b.application_date : b.shortlisted_date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 10);

  // Format shortlisted jobs for display
  const shortlistedJobsFormatted = shortlistedJobs.map(item => ({
    job_id: item.job?.job_id,
    job_title: item.job?.job_title,
    company: item.job?.company_name,
    location: item.job?.job_location,
    salary: item.job?.job_salary,
    is_remote: item.job?.job_remote,
    shortlisted_date: item.created_at
  }));

  // Generate application status breakdown
  const applicationStatuses = await getApplicationStatusBreakdown(recentApplications);
  
  // Generate recent activity timeline
  const recentActivity = generateRecentActivity(recentApplications, shortlistedJobs);

  return {
    user_info: {
      name: jobseekerProfile?.full_name || 'Jobseeker',
      job_title: jobseekerProfile?.job_title || 'Professional',
      profile_logo: jobseekerProfile?.profile_logo || null,
      total_resumes: totalResumes
    },
    summary: {
      applied_jobs: appliedJobsCount,
      job_alerts: jobAlertsCount,
      resumes: totalResumes,
      shortlist: shortlistedJobsCount
    },
    profile_views: profileViews,
    shortlisted_jobs: shortlistedJobsFormatted,
    notifications: allNotifications,
    application_statuses: applicationStatuses,
    recent_activity: recentActivity,
    insights: {
      profile_completion: calculateProfileCompletion(jobseekerProfile),
      application_success_rate: calculateSuccessRate(recentApplications),
      top_skills: await getTopSkills(),
      recommended_jobs: await getRecommendedJobs()
    }
  };
}

// Helper function to get application status breakdown
export async function getApplicationStatusBreakdown(applications: any[]) {
  const statusCounts: { [key: string]: number } = {};
  
  applications.forEach(app => {
    const status = app.application_status || 'PENDING';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / applications.length) * 100)
  }));
}

// Helper function to generate recent activity timeline
export function generateRecentActivity(applications: any[], shortlistedJobs: any[]) {
  const activities: Array<{
    type: string;
    action: string;
    target: string;
    company: string;
    timestamp: Date;
    icon: string;
  }> = [];
  
  // Add recent applications
  applications.slice(0, 5).forEach(app => {
    activities.push({
      type: 'application',
      action: 'Applied to job',
      target: app.job?.job_title || 'Unknown Job',
      company: app.job?.company_name || 'Unknown Company',
      timestamp: app.applied_at,
      icon: 'briefcase'
    });
  });
  
  // Add recent shortlists
  shortlistedJobs.slice(0, 3).forEach(item => {
    activities.push({
      type: 'shortlist',
      action: 'Shortlisted for job',
      target: item.job?.job_title || 'Unknown Job',
      company: item.job?.company_name || 'Unknown Company',
      timestamp: item.created_at,
      icon: 'bookmark'
    });
  });
  
  // Sort by timestamp and return recent 8 activities
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

// Helper function to calculate profile completion percentage
export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;
  
  const fields = [
    profile.full_name,
    profile.job_title,
    profile.phone,
    profile.email,
    profile.description,
    profile.experience,
    profile.education_level
  ];
  
  const completedFields = fields.filter(field => field && field.trim() !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

// Helper function to calculate application success rate
export function calculateSuccessRate(applications: any[]): number {
  if (applications.length === 0) return 0;
  
  const successfulApplications = applications.filter(app => 
    app.application_status === 'ACCEPTED' || 
    app.application_status === 'INTERVIEW' ||
    app.application_status === 'SHORTLISTED'
  ).length;
  
  return Math.round((successfulApplications / applications.length) * 100);
}

// Helper function to get top skills (mock data for now)
export async function getTopSkills(): Promise<string[]> {
  // This could be replaced with actual skills from u_skills table
  return ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'];
}

// Helper function to get recommended jobs (mock data for now)
export async function getRecommendedJobs(): Promise<any[]> {
  // This could be replaced with actual job recommendations based on skills and preferences
  return [
    {
      job_id: 1,
      job_title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      location: 'Remote',
      match_percentage: 95
    },
    {
      job_id: 2,
      job_title: 'Full Stack Engineer',
      company: 'Startup Inc',
      location: 'San Francisco, CA',
      match_percentage: 88
    }
  ];
}

// Helper function to generate mock profile views data
export function generateProfileViewsData() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  const currentMonth = new Date().getMonth();
  
  // Generate data for the last 6 months
  const profileViews = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const month = months[monthIndex];
    
    // Generate realistic profile view data
    let views;
    if (i === 0) { // Current month
      views = Math.floor(Math.random() * 100) + 150; // 150-250
    } else if (i === 1) { // Last month
      views = Math.floor(Math.random() * 100) + 100; // 100-200
    } else if (i === 2) { // 2 months ago
      views = Math.floor(Math.random() * 100) + 200; // 200-300
    } else if (i === 3) { // 3 months ago
      views = Math.floor(Math.random() * 100) + 300; // 300-400 (peak)
    } else if (i === 4) { // 4 months ago
      views = Math.floor(Math.random() * 100) + 100; // 100-200
    } else { // 5 months ago
      views = Math.floor(Math.random() * 100) + 150; // 150-250
    }
    
    profileViews.push({
      month,
      views
    });
  }
  
  return profileViews;
}

// Helper function to calculate profile completion from database
export async function calculateProfileCompletionFromDB(jobseeker_id: number): Promise<number> {
  try {
    const profile = await prisma.jobseeker_profile.findUnique({
      where: { jobseeker_id },
      select: {
        full_name: true,
        job_title: true,
        phone: true,
        email: true,
        description: true,
        experience: true,
        education_level: true,
        current_salary: true,
        expected_salary: true,
        country: true,
        city: true
      }
    });

    if (!profile) return 0;

    const fields = [
      profile.full_name,
      profile.job_title,
      profile.phone,
      profile.email,
      profile.description,
      profile.experience,
      profile.education_level,
      profile.current_salary,
      profile.expected_salary,
      profile.country,
      profile.city
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  } catch (error) {
    console.error('Error calculating profile completion:', error);
    return 0;
  }
}

// Helper function to calculate application success rate from database
export async function calculateApplicationSuccessRateFromDB(jobseeker_id: number): Promise<number> {
  try {
    const applications = await prisma.application.findMany({
      where: { 
        application_jobseeker_id: jobseeker_id,
        is_active: true
      },
      select: { application_status: true }
    });

    if (applications.length === 0) return 0;

    const successfulApplications = applications.filter(app => 
      app.application_status === 'ACCEPTED' || 
      app.application_status === 'INTERVIEW' ||
      app.application_status === 'SHORTLISTED'
    ).length;

    return Math.round((successfulApplications / applications.length) * 100);
  } catch (error) {
    console.error('Error calculating application success rate:', error);
    return 0;
  }
}

// Helper function to get monthly applications
export async function getMonthlyApplications(jobseeker_id: number) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const applications = await prisma.application.findMany({
      where: {
        application_jobseeker_id: jobseeker_id,
        is_active: true,
        applied_at: {
          gte: sixMonthsAgo
        }
      },
      select: { applied_at: true }
    });

    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize all months with 0
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = 0;
    }

    // Count applications per month
    applications.forEach(app => {
      const month = months[app.applied_at.getMonth()];
      if (monthlyData[month] !== undefined) {
        monthlyData[month]++;
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  } catch (error) {
    console.error('Error getting monthly applications:', error);
    return [];
  }
}

// Helper function to get top applied companies
export async function getTopAppliedCompanies(jobseeker_id: number) {
  try {
    const applications = await prisma.application.findMany({
      where: {
        application_jobseeker_id: jobseeker_id,
        is_active: true
      },
      include: {
        job: {
          select: { company_name: true }
        }
      }
    });

    const companyCounts: { [key: string]: number } = {};
    applications.forEach(app => {
      const company = app.job?.company_name || 'Unknown Company';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    return Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error('Error getting top applied companies:', error);
    return [];
  }
}
