import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { BarChart } from '@mui/x-charts';
import { brand } from '../../shared-theme/themePrimitives';
import { DataService } from '../../services/dataService';
import Loading from '../Loading/Loading';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import AddEditStatDialog from './AddEditStatDialog';

export default function Datos() {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = React.useState(800);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [seriesLabel, setSeriesLabel] = React.useState<string>('Concentracion de cloro');
  const [loading, setLoading] = React.useState(true);
  const [statsData, setStatsData] = React.useState<any[]>([]);
  const [selectedStatId, setSelectedStatId] = React.useState<number>(0);
  const { isAuthenticated } = useAuth();
  const { openDialog } = useDialog();

  // Load chart data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        const stats = await DataService.getStatsData(1);
        if (stats && stats.length > 0) {
          setStatsData(stats);
          // Load the first stat by default
          const stat = stats[0];
          const parsedData = JSON.parse(stat.number.replaceAll(/\\/g,'"'));
          setChartData(parsedData);
          setSeriesLabel(stat.label);
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update chart when selected stat changes
  React.useEffect(() => {
    if (statsData.length > 0 && selectedStatId < statsData.length) {
      const stat = statsData[selectedStatId];
      try {
        const parsedData = JSON.parse(stat.number.replaceAll(/\\/g,'"'));
        setChartData(parsedData);
        setSeriesLabel(stat.label);
      } catch (error) {
        console.error('Failed to parse chart data:', error);
      }
    }
  }, [selectedStatId, statsData]);

  const handleEditClick = () => {
    if (statsData.length > 0 && selectedStatId < statsData.length) {
      const stat = statsData[selectedStatId];
      try {
        const parsedData = JSON.parse(stat.number.replaceAll(/\\/g,'"'));
        openDialog({
          title: 'Editar Dataset',
          icon: 'Edit',
          content: (
            <AddEditStatDialog
              initialLabel={stat.label}
              initialChartData={parsedData}
              statId={stat.id}
              sortOrder={stat.sort_order}
              mode="edit"
              onSave={async () => {
                const updatedStats = await DataService.getStatsData(1);
                setStatsData(updatedStats || []);
                // Update current chart data
                if (updatedStats && updatedStats.length > selectedStatId) {
                  const updatedStat = updatedStats[selectedStatId];
                  const updatedParsedData = JSON.parse(updatedStat.number.replaceAll(/\\/g,'"'));
                  setChartData(updatedParsedData);
                  setSeriesLabel(updatedStat.label);
                }
              }}
            />
          ),
          maxWidth: 'md',
          fullWidth: true
        });
      } catch (error) {
        console.error('Failed to parse chart data for edit:', error);
      }
    }
  };

  // Responsive chart width
  React.useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth;
        setChartWidth(Math.max(containerWidth, 300));
      }
    };

    updateChartWidth();
    window.addEventListener('resize', updateChartWidth);
    return () => window.removeEventListener('resize', updateChartWidth);
  }, [chartData]);

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
        py: 4,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 4,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl fullWidth>
            <InputLabel id="dataset-select-label">Seleccionar Dataset</InputLabel>
            <Select
              labelId="dataset-select-label"
              id="dataset-select"
              value={selectedStatId}
              label="Seleccionar Dataset"
              onChange={(e) => setSelectedStatId(Number(e.target.value))}
              sx={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {statsData.map((stat, index) => (
                <MenuItem key={stat.id} value={index} sx={{ fontFamily: 'Inter, sans-serif' }}>
                  {stat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isAuthenticated && (
            <IconButton
              onClick={handleEditClick}
              sx={{
                color: brand[700],
                '&:hover': {
                  color: brand[900],
                  backgroundColor: brand[100],
                },
              }}
              aria-label="Editar"
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>
        <Box ref={chartContainerRef} sx={{ width: '100%', height: '40dvh' }}>
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#52bc52" />
                <stop offset="100%" stopColor="#042f04" />
              </linearGradient>
            </defs>
          </svg>
          <BarChart
            dataset={chartData}
            xAxis={[{
              scaleType: 'band',
              dataKey: 'label',
              labelStyle: {
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
              },
            }]}
            yAxis={[{
              labelStyle: {
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
              },
            }]}
            series={[{
              dataKey: 'value',
              color: brand[500],
            }]}
            width={chartWidth}
            margin={{ top: 60, right: 0, left: 0, bottom: 60 }}
            slotProps={{
              bar: {
                style: {
                  fill: 'url(#barGradient)',
                },
              },
              legend: {
                position: { vertical: 'top', horizontal: 'middle' },
                labelStyle: {
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
}
