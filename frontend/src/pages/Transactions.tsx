import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Button,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ArrowUpward as IncomeIcon,
  ArrowDownward as ExpenseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { Transaction } from '../types/transaction';
import TransactionDialog from '../components/transactions/TransactionDialog';
import { useAuth } from '../contexts/AuthContext';
import { transactionService } from '../services/transactionService';

// Sort functions
type Order = 'asc' | 'desc';
type OrderBy = keyof Transaction;

interface HeadCell {
  id: OrderBy;
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'date', label: 'Date', numeric: false, sortable: true },
  { id: 'description', label: 'Description', numeric: false, sortable: true },
  { id: 'category', label: 'Category', numeric: false, sortable: true },
  { id: 'amount', label: 'Amount', numeric: true, sortable: true },
  { id: 'id', label: 'Actions', numeric: false, sortable: false },
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];
  
  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(
  order: Order,
  orderBy: OrderBy,
): (a: Transaction, b: Transaction) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array: Transaction[], comparator: (a: Transaction, b: Transaction) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [Transaction, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const TransactionsPage: React.FC = () => {
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for sorting and pagination
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Categories derived from transactions
  const [categories, setCategories] = useState<string[]>([]);

  // State for transaction dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!currentUser?.accountId) {
          throw new Error('No account ID available');
        }
        
        const result = await transactionService.getTransactions(currentUser.accountId);
        setTransactions(result);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(result.map(tx => tx.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [currentUser]);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = categoryFilter === '' || transaction.category === categoryFilter;
    
    // Type filter
    const matchesType = typeFilter === '' || transaction.type === typeFilter;
    
    // Date range filter
    const matchesDateRange = 
      (!startDate || new Date(transaction.date) >= startDate) &&
      (!endDate || new Date(transaction.date) <= endDate);
    
    // Amount range filter
    const amount = transaction.amount;
    const matchesAmountRange = 
      (minAmount === '' || amount >= parseFloat(minAmount)) &&
      (maxAmount === '' || amount <= parseFloat(maxAmount));
    
    return matchesSearch && matchesCategory && matchesType && matchesDateRange && matchesAmountRange;
  });

  // Sort and paginate
  const sortedTransactions = stableSort(filteredTransactions, getComparator(order, orderBy));
  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle sort request
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
    setStartDate(null);
    setEndDate(null);
    setMinAmount('');
    setMaxAmount('');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary statistics
  const totalIncome = filteredTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalExpenses = filteredTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
  const netAmount = totalIncome - totalExpenses;

  // Handle opening the dialog for adding a new transaction
  const handleAddTransaction = () => {
    setSelectedTransaction(undefined);
    setDialogOpen(true);
  };

  // Handle opening the dialog for editing an existing transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setLoading(true);
      try {
        // In a real app, call API
        // await transactionService.deleteTransaction('demo', transaction.id);
        console.log('Deleting transaction:', transaction.id);
        
        // Remove from local state
        setTransactions(transactions.filter(t => t.id !== transaction.id));
      } catch (err) {
        setError('Failed to delete transaction');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle saving a transaction (create or update)
  const handleSaveTransaction = () => {
    // Refresh transactions
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // In a real app, you would fetch from an API
        setTransactions(transactions);
        setLoading(false);
      } catch (err) {
        setError('Failed to refresh transactions');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Transactions
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120, bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Income
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1, color: 'success.main' }}>
              {formatCurrency(totalIncome)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {filteredTransactions.filter(tx => tx.amount > 0).length} transactions
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120, bgcolor: '#fce4ec' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Expenses
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1, color: 'error.main' }}>
              {formatCurrency(totalExpenses)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {filteredTransactions.filter(tx => tx.amount < 0).length} transactions
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120, bgcolor: '#f3e5f5' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Net
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                color: netAmount >= 0 ? 'success.main' : 'error.main' 
              }}
            >
              {formatCurrency(netAmount)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {filteredTransactions.length} total transactions
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleAddTransaction}
              >
                Add Transaction
              </Button>
            </Box>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DatePicker
                        label="From Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DatePicker
                        label="To Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Min Amount"
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max Amount"
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </Box>
              </Grid>
            </>
          )}
          
          {/* Active Filters */}
          {(categoryFilter || typeFilter || startDate || endDate || minAmount || maxAmount) && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {categoryFilter && (
                  <Chip 
                    label={`Category: ${categoryFilter}`} 
                    onDelete={() => setCategoryFilter('')}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {typeFilter && (
                  <Chip 
                    label={`Type: ${typeFilter}`} 
                    onDelete={() => setTypeFilter('')}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {startDate && (
                  <Chip 
                    label={`From: ${format(startDate, 'MMM d, yyyy')}`} 
                    onDelete={() => setStartDate(null)}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {endDate && (
                  <Chip 
                    label={`To: ${format(endDate, 'MMM d, yyyy')}`} 
                    onDelete={() => setEndDate(null)}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {minAmount && (
                  <Chip 
                    label={`Min: $${minAmount}`} 
                    onDelete={() => setMinAmount('')}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {maxAmount && (
                  <Chip 
                    label={`Max: $${maxAmount}`} 
                    onDelete={() => setMaxAmount('')}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Transactions Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        {headCell.sortable ? (
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={() => handleRequestSort(headCell.id)}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        ) : (
                          headCell.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.category && (
                            <Chip 
                              icon={<CategoryIcon />} 
                              label={transaction.category} 
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'flex-end',
                            color: transaction.amount >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {transaction.amount >= 0 ? (
                              <IncomeIcon fontSize="small" sx={{ mr: 0.5 }} />
                            ) : (
                              <ExpenseIcon fontSize="small" sx={{ mr: 0.5 }} />
                            )}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteTransaction(transaction)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Add the TransactionDialog */}
      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transaction={selectedTransaction}
        accountId="demo" // In a real app, this would be the selected account ID
        onSave={handleSaveTransaction}
      />
    </Container>
  );
};

export default TransactionsPage; 