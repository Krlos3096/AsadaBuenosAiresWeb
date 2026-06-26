import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { DataService } from '../../services/dataService';
import { getImageUrl } from '../../services/dataService';
import { iconMap } from '../GenericCard/GenericCard';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import AddEditDialogContent from '../AddEditDialog/AddEditDialogContent';
import Loading from '../Loading/Loading';
import './NuestraHistoria.scss';

// Hook for number animation
const useNumberAnimation = (end: string | number, duration: number = 1000) => {
  const [count, setCount] = React.useState(0);

  // Extract numeric value from string like "2,500+" or "99.5%"
  const parseEndValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Format the number back to the original format
  const formatNumber = (value: number, original: string | number): string => {
    if (typeof original === 'number') return value.toString();
    const hasPercent = original.toString().includes('%');
    const hasPlus = original.toString().includes('+');
    
    let formatted = value.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (hasPercent) formatted += '%';
    if (hasPlus) formatted += '+';
    return formatted;
  };

  const endValue = parseEndValue(end);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = endValue * easeOutQuart;
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration]);

  return formatNumber(count, end);
};

// StatCard component to properly use the hook
function StatCard({ number, label, onEdit }: { number: string | number; label: string; onEdit?: () => void }) {
  const animatedNumber = useNumberAnimation(number);
  const { isAuthenticated } = useAuth();
  return (
    <Card className="stat-card" sx={{ textAlign: "center", py: 3, position: 'relative' }}>
      {isAuthenticated && onEdit && (
        <IconButton
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={onEdit}
          color="primary"
        >
          <EditIcon />
        </IconButton>
      )}
      <CardContent>
        <Typography
          variant="h3"
          component="div"
          className="stat-number"
          sx={{ fontWeight: "bold", color: "primary.main" }}
        >
          {animatedNumber}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          className="stat-label"
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function NuestraHistoria() {
  const [timelineData, setTimelineData] = React.useState<any[]>([]);
  const [statsData, setStatsData] = React.useState<any[]>([]);
  const [mission, setMission] = React.useState<{ title: string; content: string } | null>(null);
  const [vision, setVision] = React.useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { isAuthenticated } = useAuth();
  const { openDialog, closeDialog } = useDialog();

  React.useEffect(() => {
    async function loadData() {
      try {
        const [timeline, stats, missionData, visionData] = await Promise.all([
          DataService.getTimeItemsData(),
          DataService.getStatsData(0),
          DataService.getMission(),
          DataService.getVision()
        ]);
        setTimelineData(timeline || []);
        setStatsData(stats || []);
        setMission(missionData || null);
        setVision(visionData || null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos';
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteTimelineItem = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Estás seguro de eliminar este hito?')) return;
    
    try {
      await DataService.deleteTimelineItem(id);
      const updatedTimeline = await DataService.getTimeItemsData();
      setTimelineData(updatedTimeline);
    } catch (error) {
      alert('Error al eliminar: ' + (error as Error).message);
    }
  };

  const handleEditTimelineItem = (item: any) => {
    openDialog({
      title: 'Editar Evento del Historial',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateTimelineItem(String(item.id), data);
              const updatedTimeline = await DataService.getTimeItemsData();
              setTimelineData(updatedTimeline);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="timeline"
          initialData={item}
          mode="edit"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleAddTimelineItem = () => {
    openDialog({
      title: 'Agregar Evento del Historial',
      icon: 'Add',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.createTimelineItem(data);
              const updatedTimeline = await DataService.getTimeItemsData();
              setTimelineData(updatedTimeline);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="timeline"
          mode="add"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleEditStats = (stat: any, index: number) => {
    openDialog({
      title: 'Editar Estadística',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              const updatedStats = [...statsData];
              updatedStats[index] = data;
              await DataService.updateStats(updatedStats);
              const newStats = await DataService.getStatsData(0);
              setStatsData(newStats || []);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="stats"
          initialData={stat}
          mode="edit"
        />
      ),
      maxWidth: 'sm',
      fullWidth: true
    });
  };

  const handleEditMission = () => {
    if (!mission) return;
    openDialog({
      title: 'Editar Misión',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateAboutContent('mission', data);
              const updatedMission = await DataService.getMission();
              setMission(updatedMission || null);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="mission"
          initialData={mission}
          mode="edit"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleEditVision = () => {
    if (!vision) return;
    openDialog({
      title: 'Editar Visión',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateAboutContent('vision', data);
              const updatedVision = await DataService.getVision();
              setVision(updatedVision || null);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="vision"
          initialData={vision}
          mode="edit"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleTimelineItemClick = (item: any) => {
    openDialog({
      title: item.title,
      image: item.image,
      icon: item.icon,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {item.year && (
            <Typography variant="h6" color="text.secondary">
              {item.year}
            </Typography>
          )}
          {item.description && (
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {item.description}
            </Typography>
          )}
        </Box>
      ),
      maxWidth: 'lg',
      fullWidth: true
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Container
      maxWidth="lg"
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Statistics Section */}
      <Box>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {statsData.map((stat, index) => (
            <Grid key={index} size={{ xs: 6, md: 3 }}>
              <StatCard 
                number={stat.number} 
                label={stat.label} 
                onEdit={() => handleEditStats(stat, index)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Timeline Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 6, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ textAlign: "center", mb: 0 }}
          >
            Hitos Importantes
          </Typography>
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTimelineItem}
              size="small"
            >
              Agregar Hito
            </Button>
          )}
        </Box>
        <Timeline position="alternate">
          {timelineData.map((item: any, index) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineConnector />
                <TimelineDot color="primary" className="timeline-dot">
                  {(item.icon && iconMap[item.icon]) || <WaterDropIcon />}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: "grey.50",
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      }
                    }}
                    onClick={() => handleTimelineItemClick(item)}
                  >
                    {item.image && (
                      <Box
                        component="img"
                        src={getImageUrl(item.image) || ''}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        sx={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 2
                        }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ fontWeight: "bold", display: "block", mb: 1 }}
                    >
                      {item.year}
                    </Typography>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ fontWeight: "bold" }}
                    >
                      {item.title}
                    </Typography>
                  </Paper>
                  {isAuthenticated && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTimelineItem(item);
                        }}
                        sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTimelineItem(String(item.id));
                        }}
                        sx={{ backgroundColor: 'error.main', color: 'error.contrastText' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>

      {/* Mission and Vision */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ position: 'relative' }}>
          <Card className="mission-card" sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ color: "primary.main", textAlign: "center" }}
              >
                {mission?.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {mission?.content}
              </Typography>
            </CardContent>
          </Card>
          {isAuthenticated && (
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={handleEditMission}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ position: 'relative' }}>
          <Card className="vision-card" sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ color: "primary.main", textAlign: "center" }}
              >
                {vision?.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {vision?.content}
              </Typography>
            </CardContent>
          </Card>
          {isAuthenticated && (
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={handleEditVision}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
