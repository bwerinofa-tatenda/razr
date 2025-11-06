import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { NoteCountByPeriod, GoalProgress, TemplateUsage, TagUsage, EmotionalTrend } from '../../lib/analyticsService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Note Analytics Chart
interface NoteAnalyticsChartProps {
  data: NoteCountByPeriod;
  title: string;
  description?: string;
}

export const NoteAnalyticsChart: React.FC<NoteAnalyticsChartProps> = ({ data, title, description }) => {
  // Use daily data if available, otherwise use weekly
  const chartDataArray = data.daily || data.weekly || [];
  
  const labels = chartDataArray.map(d => 'date' in d ? d.date : 'week' in d ? d.week : d.month);
  const counts = chartDataArray.map(d => d.count);
  
  const chartConfig = {
    labels: labels,
    datasets: [
      {
        label: 'Note Count',
        data: counts,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartConfig} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

// Goal Progress Chart
interface GoalProgressChartProps {
  data: GoalProgress[];
  title: string;
  description?: string;
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ data, title, description }) => {
  const chartData = {
    labels: data.map(d => d.goalName),
    datasets: [
      {
        label: 'Progress %',
        data: data.map(d => d.progress),
        backgroundColor: data.map(d => d.progress > 80 ? 'rgba(34, 197, 94, 0.8)' : 
                        d.progress > 50 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
        borderColor: data.map(d => d.progress > 80 ? 'rgb(34, 197, 94)' : 
                        d.progress > 50 ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)'),
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

// Template Usage Chart
interface TemplateUsageChartProps {
  data: TemplateUsage[];
  title: string;
  description?: string;
}

export const TemplateUsageChart: React.FC<TemplateUsageChartProps> = ({ data, title, description }) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(251, 191, 36, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(147, 51, 234, 0.8)',
    'rgba(20, 184, 166, 0.8)'
  ];

  const chartData = {
    labels: data.map(d => d.templateName),
    datasets: [
      {
        data: data.map(d => d.usageCount),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

// Tag Usage Chart
interface TagUsageChartProps {
  data: TagUsage[];
  title: string;
  description?: string;
}

export const TagUsageChart: React.FC<TagUsageChartProps> = ({ data, title, description }) => {
  const topTags = data.slice(0, 10); // Show top 10 tags

  const chartData = {
    labels: topTags.map(d => d.tagName),
    datasets: [
      {
        label: 'Usage Count',
        data: topTags.map(d => d.usageCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    indexAxis: 'y' as const,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Correlation Chart
interface PerformanceCorrelationChartProps {
  data: Array<{ x: number; y: number; label: string }>;
  title: string;
  description?: string;
}

export const PerformanceCorrelationChart: React.FC<PerformanceCorrelationChartProps> = ({ data, title, description }) => {
  const chartData = {
    datasets: [
      {
        label: 'Performance',
        data: data.map(d => ({ x: d.x, y: d.y })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Notes Created'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Win Rate %'
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

// Emotional Trend Chart
interface EmotionalTrendChartProps {
  data: EmotionalTrend[];
  title: string;
  description?: string;
}

export const EmotionalTrendChart: React.FC<EmotionalTrendChartProps> = ({ data, title, description }) => {
  const emotions = ['confident', 'anxious', 'excited', 'fearful', 'greedy', 'patient', 'disciplined'];
  const emotionLabels = ['Confident', 'Anxious', 'Excited', 'Fearful', 'Greedy', 'Patient', 'Disciplined'];
  
  const chartData = {
    labels: emotionLabels,
    datasets: [
      {
        label: 'Frequency',
        data: emotions.map(emotion => 
          data.filter(d => d.emotion === emotion).reduce((sum, d) => sum + d.frequency, 0)
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...data.map(d => d.frequency)) + 5
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Radar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};