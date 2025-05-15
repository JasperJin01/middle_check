"use client";
import React, { useState } from 'react';
import {
  Box, Grid, Button, Select, MenuItem,
  Paper, Typography, LinearProgress
} from '@mui/material';
import ReadOnlyCodeBox from '../../part2/sub1/CodeContainer';
import request from '@/lib/request/request';

const frameworks = {
  'Pregel': ['bfs', 'sssp', 'ppr'],
  'DGL': ['gcn'],
};


export default function FrameworkConversionPage() {
  const [selectedFramework, setSelectedFramework] = useState(Object.keys(frameworks)[0]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(frameworks[Object.keys(frameworks)[0]][0]);
  const [originalCodeDisplay, setOriginalCodeDisplay] = useState('');
  const [transformedCode, setTransformedCode] = useState('');
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const resultsBoxRef = React.useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (resultsBoxRef.current) {
      resultsBoxRef.current.scrollTop = resultsBoxRef.current.scrollHeight;
    }
  };

  // 自动滚动
  React.useEffect(() => {
    scrollToBottom();
  }, [results]);



  const handleFrameworkChange = (event) => {
    const framework = event.target.value;
    setSelectedFramework(framework);
    if (frameworks[framework].length > 0) {
      setSelectedAlgorithm(frameworks[framework][0]);
    } else {
      setSelectedAlgorithm('');
    }
    setOriginalCodeDisplay('');
    setTransformedCode('');
    setResults({});
  };

  const handleAlgorithmChange = (event) => {
    const algorithm = event.target.value;
    setSelectedAlgorithm(algorithm);
    setOriginalCodeDisplay('');
    setTransformedCode('');
    setResults({});
  };

  const handleRun = async () => {
    if (isRunning || !selectedAlgorithm) {
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults({ 'Terminal执行结果': '正在与服务器建立连接...\n' });

    try {
      // 1. 执行流式命令
      const eventSource = new EventSource(`${request.BASE_URL}/part3/execute/2/${selectedAlgorithm}/`);
      let terminalOutput = '';

      eventSource.onmessage = async (event) => {
        if (event.data === '[done]') {
          eventSource.close();
          
          // 2. 显示正在拷贝result
          setResults(prev => ({
            'Terminal执行结果': prev['Terminal执行结果'] + '正在拷贝result\n'
          }));
          
          // 3. 获取最终结果
          try {
            const res = await fetch(`${request.BASE_URL}/part3/result/2/${selectedAlgorithm}/`);
            const jsonData = await res.json();
            
            // 4. 显示完成
            setResults(prev => ({
              'Terminal执行结果': prev['Terminal执行结果'] + '完成\n'
            }));

            // 更新原始代码显示
            const originalCode = selectedFramework === 'Pregel' ? jsonData.data.pregel : jsonData.data.dgl;
            setOriginalCodeDisplay(originalCode ? originalCode.join('\n') : '');
            
            // 更新转换后的代码
            setTransformedCode(jsonData.data.CGA ? jsonData.data.CGA.join('\n') : '');
            
            // 更新其他结果
            setResults(prev => ({
              ...prev,
              'graphIR示例': jsonData.data.GraphIR ? jsonData.data.GraphIR.join('\n') : '',
              'MatrixIR示例': jsonData.data.MatrixIR ? jsonData.data.MatrixIR.join('\n') : '',
              '硬件指令示例': jsonData.data.asm ? jsonData.data.asm.join('\n') : ''
            }));
            
            setProgress(100);
          } catch (error) {
            setResults(prev => ({
              'Terminal执行结果': prev['Terminal执行结果'] + `获取结果失败: ${error.message}\n`
            }));
          } finally {
            setIsRunning(false);
          }
          
        } else if (event.data === '[error]') {
          eventSource.close();
          setResults(prev => ({
            'Terminal执行结果': prev['Terminal执行结果'] + '\n执行出错\n'
          }));
          setIsRunning(false);
        } else {
          setResults(prev => ({
            'Terminal执行结果': prev['Terminal执行结果'] + event.data + '\n'
          }));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setResults(prev => ({
          'Terminal执行结果': prev['Terminal执行结果'] + '\n连接错误\n'
        }));
        setIsRunning(false);
      };

    } catch (error) {
      setResults({
        'Terminal执行结果': `执行失败: ${error.message}`
      });
      setIsRunning(false);
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

      {/* 运行控制模块和Terminal执行结果并排 */}
      <Grid container spacing={3} mb={2} alignItems="stretch">
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main', borderBottom: '2px solid', borderColor: 'secondary.main', pb: 1 }}>
              运行控制
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 550, fontSize: '16px', mb: 1 }}>
                选择框架
              </Typography>
              <Select
                fullWidth
                value={selectedFramework}
                onChange={handleFrameworkChange}
                disabled={isRunning}
              >
                {Object.keys(frameworks).map((framework) => (
                  <MenuItem key={framework} value={framework}>
                    {framework}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 550, fontSize: '16px', mb: 1 }}>
                选择算法
              </Typography>
              <Select
                fullWidth
                value={selectedAlgorithm}
                onChange={handleAlgorithmChange}
                disabled={isRunning || !selectedFramework || frameworks[selectedFramework].length === 0}
              >
                {frameworks[selectedFramework]?.map((algorithm) => (
                  <MenuItem key={algorithm} value={algorithm}>
                    {algorithm}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRun} 
              disabled={isRunning || !selectedAlgorithm} 
              sx={{ marginBottom: 2 }}
            >
              {isRunning ? '运行中...' : '运行'}
            </Button>
            {isRunning && <LinearProgress value={progress} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              Terminal执行结果
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
              flex: 1,
              whiteSpace: 'pre',
            }} ref={resultsBoxRef}>
              {results['Terminal执行结果'] || ''}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 代码展示区域 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* 原框架代码 */}
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, mb: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              原框架代码
            </Typography>
            <ReadOnlyCodeBox content={originalCodeDisplay} height={300} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          {/* 现框架代码 */}
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, mb: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              现框架代码
            </Typography>
            <ReadOnlyCodeBox content={transformedCode} height={300} />
          </Paper>
        </Grid>
      </Grid>

      {/* 结果展示 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 450 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              graphIR示例
            </Typography>
            <ReadOnlyCodeBox content={results['graphIR示例'] || ''} height={350} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 450 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              MatrixIR示例
            </Typography>
            <ReadOnlyCodeBox content={results['MatrixIR示例'] || ''} height={350} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 450 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              硬件指令示例
            </Typography>
            <ReadOnlyCodeBox content={results['硬件指令示例'] || ''} height={350} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
