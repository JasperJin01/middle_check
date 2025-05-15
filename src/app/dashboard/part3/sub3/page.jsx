"use client";
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Button, Select, MenuItem,
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Label } from 'recharts';
import request from '@/lib/request/request';

const datasets = {
  'askubuntu': 'AskUbuntu数据集',
  'wiki': 'Wikipedia数据集',
  'stack': 'Stack Overflow数据集',
};

const datasetDetails = [
  { name: 'sx-askubuntu', size: '159316', format: '596933', description: 'Ask ubuntu社交网站用户交互行为数据' },
  { name: 'wiki-talk-temporal', size: '1140149', format: '3309592', description: 'Wikipedia上用户维护talk页面的记录' },
  { name: 'sx-stackoverflow', size: '2601977', format: '36233450', description: 'stackoverflow社交网站用户交互行为数据' },
];

// 初始化性能数据数组
const initialPerformanceData = Object.keys(datasets).map(dataset => ({
  name: dataset,
  duration: 0,
  speed: 0
}));

export default function DataProcessingPage() {
  const [selectedDataset, setSelectedDataset] = useState(Object.keys(datasets)[0]);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [performanceData, setPerformanceData] = useState(initialPerformanceData);

  const handleDatasetChange = (event) => {
    setSelectedDataset(event.target.value);
    setTerminalOutput('');
  };

  const handleRun = async () => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setTerminalOutput('> 正在与服务器建立连接...\n');

    try {
      // 1. 执行流式命令
      const eventSource = new EventSource(`${request.BASE_URL}/part3/execute/3/${selectedDataset}/`);
      
      eventSource.onmessage = async (event) => {
        if (event.data === '[done]') {
          eventSource.close();
          
          // 2. 显示正在拷贝result
          setTerminalOutput(prev => prev + '> 正在拷贝result...\n');
          setProgress(75);
          
          // 3. 获取最终结果
          try {
            const res = await fetch(`${request.BASE_URL}/part3/result/3/${selectedDataset}/`);
            const jsonData = await res.json();
            
            if (jsonData.runs && jsonData.runs.length > 0) {
              // 计算平均性能
              const avgDuration = jsonData.runs.reduce((acc, run) => acc + run.duration_ms, 0) / jsonData.runs.length;
              const avgSpeed = jsonData.runs.reduce((acc, run) => acc + run.speed_meps, 0) / jsonData.runs.length;

              // 更新性能数据
              setPerformanceData(prev => {
                const newData = [...prev];
                const index = newData.findIndex(item => item.name === selectedDataset);
                if (index !== -1) {
                  newData[index] = {
                    ...newData[index],
                    duration: parseFloat(avgDuration.toFixed(2)),
                    speed: parseFloat(avgSpeed.toFixed(2))
                  };
                }
                return newData;
              });

              // 更新终端输出
              setTerminalOutput(prev => 
                prev + 
                `> 数据集: ${jsonData.data}\n` +
                `> 框架: ${jsonData.framework}\n` +
                `> 平均执行时间: ${avgDuration.toFixed(2)}ms\n` +
                `> 平均更新速度: ${avgSpeed.toFixed(2)} MEPS\n` +
                `> 运行次数: ${jsonData.runs.length}\n` +
                `> 状态: 成功\n`
              );
            }
            setIsRunning(false)
          } catch (error) {
            setTerminalOutput(prev => prev + `> ❌ 获取结果失败: ${error.message}\n`);
            setProgress(0);
          }
        } else if (event.data === '[error]') {
          eventSource.close();
          setTerminalOutput(prev => prev + '> ❌ 执行出错\n');
          setProgress(0);
        } else {
          setTerminalOutput(prev => prev + `> ${event.data}\n`);
          setProgress(25);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setTerminalOutput(prev => prev + '> ❌ 连接错误\n');
        setProgress(0);
      };

    } catch (error) {
      setTerminalOutput(prev => prev + `> ❌ 执行失败: ${error.message}\n`);
      setProgress(0);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f6fa' }}>
      {/* 顶部文字说明模块 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: '#f0f4f8', border: '1px solid #e0e0e0' }}>
        <Typography variant="body1" component="div" sx={{ lineHeight: 1.6, color: '#2d3436', fontSize: '0.95rem' }}>
          <strong>考核指标：</strong>
          <Box component="span" display="block">建立统一图计算编程模型和编译工具</Box>
          <Box component="span" display="block">动态图更新性能达到每秒百万条边</Box>
          <strong>中期指标：</strong>
          <Box component="span" display="block">指标3.1：抽象出图遍历、图挖掘、图学习所具有的共性计算特征</Box>
          <Box component="span" display="block">指标3.2：使用SNAP标准动态图数据集进行评测，动态图更新速率达到每秒五十万条边</Box>
          <strong>完成时指标：</strong>
          <Box component="span" display="block">指标3.1：提出对图计算、图挖掘、图学习算法统一化表达的编程模型和编译工具</Box>
          <Box component="span" display="block">指标3.2：使用SNAP标准动态图数据集进行评测，动态图更新速率达到每秒百万条边</Box>
          <strong>考核方式：</strong>
          <Box component="span" display="block">首先，将图遍历、图学习、图挖掘应用采用CGA编程模型统一化表达</Box>
          <Box component="span" display="block">然后，将CGA编程模型经过多层编译，转换成图计算加速卡（模拟器）上运行的代码</Box>
          <Box component="span" display="block">最后，支持Pregel框架向CGA编程模型的转换</Box>
          <Box component="span" display="block">使用SNAP标准动态图数据集进行评测，性能指标计算方法是：动态图更新速率=总更新边数/总更新时间</Box>
          <strong>数据集来源：</strong>
          <Box component="span" display="block">采用选自斯坦福网络分析平台（SNAP）的标准动态图数据集sx-askubuntu、wiki-talk-temporal和sx-stackoverflow</Box>
        </Typography>
      </Paper>

      {/* 数据集说明表格 */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
          数据集说明
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="数据集说明">
            <TableHead>
              <TableRow>
                <TableCell>数据集名称</TableCell>
                <TableCell align="right">点规模</TableCell>
                <TableCell align="right">边规模</TableCell>
                <TableCell>来源说明</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasetDetails.map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">{row.name}</TableCell>
                  <TableCell align="right">{row.size}</TableCell>
                  <TableCell align="right">{row.format}</TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 运行控制模块单独一行 */}
      <Grid container spacing={3} mb={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main', borderBottom: '2px solid', borderColor: 'secondary.main', pb: 1 }}>
              运行控制
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 550, fontSize: '16px', mb: 1 }}>
                选择数据集
              </Typography>
              <Select
                fullWidth
                value={selectedDataset}
                onChange={handleDatasetChange}
                disabled={isRunning}
              >
                {Object.keys(datasets).map((dataset) => (
                  <MenuItem key={dataset} value={dataset}>
                    {dataset}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRun} 
              disabled={isRunning}
              sx={{ mb: 2 }}
            >
              {isRunning ? '运行中...' : '运行'}
            </Button>
            {isRunning && <LinearProgress value={progress} />}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main'}}>
              Terminal 执行结果
            </Typography>
            <Box sx={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              overflow: 'auto',
              padding: '16px',
              borderRadius: '4px',
              height: '300px',
              whiteSpace: 'pre',
            }}>
              {terminalOutput || ''}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 性能数据展示 */}
      <Grid container spacing={3}>
        {/* 性能表格 */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              性能测试结果
            </Typography>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="性能测试结果">
                <TableHead>
                  <TableRow>
                    <TableCell>数据集</TableCell>
                    <TableCell align="right">平均执行时间 (ms)</TableCell>
                    <TableCell align="right">平均更新速度 (MEPS)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell align="right">
                        {row.duration || '-'}
                      </TableCell>
                      <TableCell align="right">
                        {row.speed || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 性能图表 */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              性能对比图表
            </Typography>
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart
                width={500}
                height={300}
                data={performanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '更新速度 (MEPS)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <ReferenceLine 
                  y={0.5} 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  strokeDasharray="5 5"  
                  label={{ 
                    value: '中期指标', 
                    position: 'right',
                    fill: '#4CAF50',
                    fontSize: 12
                  }}
                />
                <ReferenceLine 
                  y={1.0} 
                  stroke="#F44336" 
                  strokeWidth={2}
                  strokeDasharray="5 5"  
                  label={{ 
                    value: '完成时指标', 
                    position: 'right',
                    fill: '#F44336',
                    fontSize: 12
                  }}
                />
                <Bar 
                  dataKey="speed" 
                  name="平均更新速度" 
                  fill="#8884d8" 
                  barSize={30}
                />
              </BarChart>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
