"use client";
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import request from '@/lib/request/request'; // 假设你有一个请求库

const algorithms = ['PageRank', 'k-Clique', 'GCN'];
// const datasets = ['Rmat-16','Rmat-18','Rmat-20', 'Wiki-Vote', 'Ego-Gplus', 'Web-Google'];
const datasets = ['Rmat-16', 'Rmat-17', 'Rmat-18', 'Rmat-19', 'Rmat-20'];
const allDatasetsOption = 'all-datasets';

// 新增算法与数据集允许组合配置
const allowedCombinations = {
  'PageRank': ['Rmat-16', 'Rmat-17', 'Rmat-18', 'Rmat-19', 'Rmat-20'],
  'k-Clique': ['Rmat-16', 'Rmat-17', 'Rmat-18', 'Rmat-19', 'Rmat-20'],
  'GCN': ['Rmat-16', 'Rmat-17', 'Rmat-18', 'Rmat-19', 'Rmat-20'],
};

const algorithmDetails = {
  PageRank: {
    description: '标准图遍历算法',
  },
  'k-Clique': {
    description: '标准图挖掘算法',
  },
  GCN: {
    description: '标准图学习算法',
  },
};

const datasetInfo = {
  'Rmat-16': { nodes: '2^16', edges: '2^20' },
  'Rmat-17': { nodes: '2^17', edges: '2^21' },
  'Rmat-18': { nodes: '2^18', edges: '2^22' },
  'Rmat-19': { nodes: '2^19', edges: '2^23' },
  'Rmat-20': { nodes: '2^20', edges: '2^24' },
};


export default function Page() {
  const [selectedAlgo, setSelectedAlgo] = useState(algorithms[0]);
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]);
  const [tabValue, setTabValue] = useState(0);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [chartMetric, setChartMetric] = useState('time');
  const [progress, setProgress] = useState(0);
  const logBoxRef = React.useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  };

  // 监听日志变化，自动滚动
  React.useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // 新增判断按钮是否可用的逻辑
  const isButtonDisabled = () => {
    if (running) return true;

    // 判断单个数据集是否允许
    if (selectedDataset !== allDatasetsOption) {
      return !allowedCombinations[selectedAlgo].includes(selectedDataset);
    }

    // 判断"全部数据集"是否允许（检查算法是否有可用的数据集）
    return true;
  };

  // 生成随机性能数据
  const generatePerformanceData = (res) => {
    const baseData = res.data;
    return {
      combinedKey: `${baseData.Algorithm}-${baseData.Dataset}`,
      algorithm: baseData.Algorithm,
      dataset: baseData.Dataset,
      nodes: baseData.Vertices,
      edges: baseData.Edges,
      cpu: baseData['CPU-Time(s)'],
      accelerator: baseData["ACC-Time(s)"],
      speedUp: baseData["Speedup"],
      throughput: baseData["GTSPS"]
    };
  };

  // 获取有效数据（已执行的数据集）
  const getValidData = () => {
    return performanceData
  };

  // 生成图表数据
  const getChartData = () => {
    return getValidData();
  };

  const handleRun = async () => {
    if (running) return;
    
    setRunning(true);
    setProgress(0);
    setLogs(['正在与服务器建立连接...']);

    try {
      const targets = selectedDataset === allDatasetsOption
        ? datasets
        : [selectedDataset];

      // 批量执行任务
      for (const dataset of targets) {
        let urlAlgo, urlData;
        
        // 算法URL
        switch(selectedAlgo) {
          case 'PageRank':
            urlAlgo = 'pagerank';
            break;
          case 'k-Clique':
            urlAlgo = 'kclique';
            break;
          case 'GCN':
            urlAlgo = 'gcn';
            break;
          default:
            throw new Error(`不支持的算法: ${selectedAlgo}`);
        }

        // 数据集URL映射
        switch(dataset) {
          case 'Rmat-16':
            urlData = 'rmat16';
            break;
          case 'Rmat-17':
            urlData = 'rmat17';
            break;
          case 'Rmat-18':
            urlData = 'rmat18';
            break;
          case 'Rmat-19':
            urlData = 'rmat19';
            break;
          case 'Rmat-20':
            urlData = 'rmat20';
            break;
          default:
            throw new Error(`不支持的数据集: ${dataset}`);
        }

        // 1. 执行流式命令
        const eventSource = new EventSource(`${request.BASE_URL}/part1/execute/${urlAlgo}/${urlData}/`);
        
        eventSource.onmessage = async (event) => {
          if (event.data === '[done]') {
            eventSource.close();
            
            // 2. 显示正在拷贝result
            setLogs(prev => [...prev, '正在拷贝result...']);
            
            // 3. 获取最终结果
            try {
              const res = await fetch(`${request.BASE_URL}/part1/result/`);
              const jsonData = await res.json();
              
              // 4. 显示完成
              setLogs(prev => [...prev, '执行完成']);
              setProgress(100);

              // 生成新的性能数据
              const newResult = generatePerformanceData(jsonData);
              
              // 更新性能数据
              setPerformanceData(prev => {
                const filtered = prev.filter(item => item.dataset !== dataset);
                return [...filtered, newResult]
                  .sort((a, b) => datasets.indexOf(a.dataset) - datasets.indexOf(b.dataset));
              });
              setRunning(false)
            } catch (error) {
              setLogs(prev => [...prev, `❌ 获取结果失败: ${error.message}`]);
              setProgress(0);
            }
            
          } else if (event.data === '[error]') {
            eventSource.close();
            setLogs(prev => [...prev, '❌ 执行出错']);
            setProgress(0);
          } else {
            setLogs(prev => [...prev, event.data]);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setLogs(prev => [...prev, '❌ 连接错误']);
          setProgress(0);
        };

        // 等待当前数据集处理完成
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!eventSource.readyState || eventSource.readyState === 2) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ 执行失败: ${error.message}`]);
      setProgress(0);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f6fa' }}>
      <Grid item xs={12} sx={{ mb: 3 }}>
        <Paper elevation={0} sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: '#f0f4f8',
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="body1" component="div" sx={{
            lineHeight: 1.6,
            color: '#2d3436',
            fontSize: '0.95rem',
            '& .red-bold': {
              fontWeight: 600,
              color: '#ff4444',
              display: 'inline',
              padding: '0 2px'
            },
            '& strong': {
              fontWeight: 600
            }
          }}>
            <strong>考核指标</strong>
            <Box component="span" display="block">
              ① 标准图遍历算法 PageRank 计算性能
            </Box>
            <Box component="span" display="block">
              ② 标准图挖掘算法 k-Clique 计算性能
            </Box>
            <Box component="span" display="block">
              ③ 标准图学习算法 GCN 计算性能
            </Box>

            <strong>中期指标：</strong>
            <Box component="span" display="block">
              ① 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>6GTEPS</span>
            </Box>
            <Box component="span" display="block">
              ② 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>1.5GTSPS</span>
            </Box>
            <Box component="span" display="block">
              ③ 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>1GOPS</span>
            </Box>

            <strong>完成时指标：</strong>
            <Box component="span" display="block">
              ① 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>10GTEPS</span>
            </Box>
            <Box component="span" display="block">
              ② 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>2GTSPS</span>
            </Box>
            <Box component="span" display="block">
              ③ 基于FPGA的图计算加速器性能达到
              <span className='red-bold'>2GOPS</span>
            </Box>

            <strong>考核方式：</strong>
            <Box component="span" display="block">
              采用Graph500标准数据集运行PageRank、k-Clique和GCN
              代码，进行实际性能测试。基准系统采用
              2023年11月立项时的最新软件版本，
              运行环境依托主流处理器Intel Xeon Gold 6338 CPU
            </Box>

            <strong>数据集来源：</strong>
            <Box component="span" display="block">
              采用Graph500标准数据集
            </Box>
          </Typography>
        </Paper>
    </Grid>
      <Grid container spacing={3}>
        {/* 左侧列 */}
        <Grid container item xs={12} md={4} spacing={3}>
          {/* 算法选择卡片 */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                算法选择
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 550, mb: 1 }}>
                选择图算法
              </Typography>
              <Select
                fullWidth
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value)}
                sx={{ mb: 2 }}
              >
                {algorithms.map(algo => (
                  <MenuItem key={algo} value={algo}>{algo}</MenuItem>
                ))}
              </Select>

              <Typography variant="subtitle1" sx={{ fontWeight: 550, mb: 1 }}>
                选择数据集
              </Typography>
              <Select
                fullWidth
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                sx={{ mb: 2 }}
              >
                {datasets.map(ds => (
                  <MenuItem key={ds} value={ds}>{ds}</MenuItem>
                ))}
                <MenuItem value={allDatasetsOption}>全部数据集</MenuItem>
              </Select>

              <Button
                variant="contained"
                fullWidth
                onClick={handleRun}
                disabled={isButtonDisabled()}
                color="success"
                sx={{ py: 1.5 }}
              >
                {running ? '执行中...' : '开始执行'}
              </Button>
              {running && <LinearProgress value={progress} sx={{ mt: 1 }} />}
            </Paper>
          </Grid>

          {/* 算法详情卡片 */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                算法详情
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>算法说明:</strong> {algorithmDetails[selectedAlgo].description}
              </Typography>
            </Paper>
          </Grid>

          {/* 数据集信息卡片 */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                {selectedDataset === allDatasetsOption ? '数据集概览' : '数据集信息'}
              </Typography>
              {selectedDataset === allDatasetsOption ? (
                <Box>
                  {datasets.map(ds => (
                    <Box key={ds} sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{ds}:</strong>
                        节点规模： {datasetInfo[ds].nodes.toLocaleString()},
                        边规模： {datasetInfo[ds].edges.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>节点规模:</strong> {datasetInfo[selectedDataset].nodes.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>边规模:</strong> {datasetInfo[selectedDataset].edges.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* 右侧列 */}
        <Grid container item xs={12} md={8} spacing={3}>
          {/* 控制台输出 */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{
              p: 2,
              height: 470,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                执行日志
              </Typography>
              <Box sx={{
                height: 400,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                backgroundColor: '#1a1a1a',
                borderRadius: 2,
                p: 1.5,
                '& > div': {
                  color: '#4caf50',
                  lineHeight: 1.6,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  py: 0.5
                }
              }} ref={logBoxRef}>
                {logs.map((log, index) => (
                  <div key={index}>{`> ${log}`}</div>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* 性能对比卡片 */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                性能对比详情
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label="表格视图" />
                  <Tab label="图表视图" />
                </Tabs>
              </Box>

              {tabValue === 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>算法</TableCell>
                        <TableCell>数据集</TableCell>
                        <TableCell>节点数</TableCell>
                        <TableCell>边数</TableCell>
                        <TableCell>CPU时间(s)</TableCell>
                        <TableCell>加速器时间(s)</TableCell>
                        <TableCell>加速比</TableCell>
                        <TableCell>吞吐量(GTEPS)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getValidData().map((row) => (
                        <TableRow key={row.dataset}>
                          <TableCell>{row.algorithm}</TableCell>
                          <TableCell>{row.dataset}</TableCell>
                          <TableCell>{row.nodes.toLocaleString()}</TableCell>
                          <TableCell>{row.edges.toLocaleString()}</TableCell>
                          <TableCell>{row.cpu.toFixed(2)}</TableCell>
                          <TableCell>{row.accelerator.toFixed(2)}</TableCell>
                          <TableCell>{row.speedUp}</TableCell>
                          <TableCell>{row.throughput}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box>
                  <Tabs
                    value={chartMetric}
                    onChange={(e, v) => setChartMetric(v)}
                    sx={{ mb: 2 }}
                  >
                    <Tab label="执行时间" value="time" />
                    <Tab label="加速比" value="speedUp" />
                    <Tab label="吞吐量" value="throughput" />
                  </Tabs>

                  <BarChart
            width={800}
            height={300}
            data={getChartData()}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="combinedKey" />
            <YAxis />
            <Tooltip />
            <Legend />

            {chartMetric === 'time' && (
                <>
                    <Bar
                        dataKey="cpu"
                        fill="#7f58af"
                        name="CPU时间"
                        barSize={50}
                    />
                    <Bar
                        dataKey="accelerator"
                        fill="#64b5f6"
                        name="加速器时间"
                        barSize={50}
                    />
                </>
            )}

            {chartMetric === 'speedUp' && (
                <Bar
                    dataKey="speedUp"
                    fill="#ef5350"
                    name="加速比"
                    barSize={50}
                />
            )}

            {chartMetric === 'throughput' && (
                <Bar
                    dataKey="throughput"
                    fill="#26a69a"
                    name="吞吐量"
                    barSize={50}
                />
            )}
        </BarChart>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Grid>
      {/* 代码转化卡片 */}
      <Grid item xs={12} sx={{ mt: 2 }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                mb: 2,
                color: 'secondary.main',
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
                pb: 1
              }}>
                代码映射
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{
                    p: 1,
                    height: 300,
                    overflow: 'auto',
                    backgroundColor: '#1e1e1e',
                    borderRadius: 2
                  }}>
                    <Typography variant="subtitle2" sx={{ color: '#d4d4d4', mb: 1 }}>
                      原始算法代码
                    </Typography>
                    <pre style={{
                      fontSize: '0.8rem',
                      color: '#d4d4d4',
                      fontFamily: '"Fira Code", monospace',
                      margin: 0
                    }}>
                      {algorithmDetails[selectedAlgo].parameters}
                    </pre>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{
                    p: 1,
                    height: 300,
                    overflow: 'auto',
                    backgroundColor: '#1e1e1e',
                    borderRadius: 2
                  }}>
                    <Typography variant="subtitle2" sx={{ color: '#d4d4d4', mb: 1 }}>
                      加速器映射代码
                    </Typography>
                    <pre style={{
                      fontSize: '0.8rem',
                      color: '#d4d4d4',
                      fontFamily: '"Fira Code", monospace',
                      margin: 0
                    }}>
                      {`// ${selectedAlgo} 加速器优化代码\n// 矩阵化优化实现...`}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
    </Box>
  );
}
