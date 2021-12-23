export interface FioResult {
    fio_version: string;
    timestamp: number;
    timestamp_ms: number;
    time: string;
    GlobalOptions: GlobalOptions;
    jobs: (JobsEntity)[];
    disk_util?: (DiskUtilEntity)[] | null;
  }
  export interface GlobalOptions {
    filename: string;
    direct: string;
    rw: string;
    bs: string;
    runtime: string;
    numjobs: string;
  }
  export interface JobsEntity {
    jobname: string;
    groupid: number;
    error: number;
    eta: number;
    elapsed: number;
    JobOptions: JobOptions;
    read: ReadOrWriteOrTrim;
    write: ReadOrWriteOrTrim;
    trim: ReadOrWriteOrTrim;
    sync: Sync;
    job_runtime: number;
    usr_cpu: number;
    sys_cpu: number;
    ctx: number;
    majf: number;
    minf: number;
    iodepth_level: IodepthLevel;
    iodepth_submit: IodepthSubmitOrIodepthComplete;
    iodepth_complete: IodepthSubmitOrIodepthComplete;
    latency_ns: LatencyNsOrLatencyUs;
    latency_us: LatencyNsOrLatencyUs;
    latency_ms: LatencyMs;
    latency_depth: number;
    latency_target: number;
    latency_percentile: number;
    latency_window: number;
  }
  export interface JobOptions {
    name: string;
    size: string;
    invalidate: string;
    overwrite: string;
  }
  export interface ReadOrWriteOrTrim {
    io_bytes: number;
    io_kbytes: number;
    bw_bytes: number;
    bw: number;
    iops: number;
    runtime: number;
    total_ios: number;
    short_ios: number;
    drop_ios: number;
    slat_ns: SlatNsOrLatNs;
    clat_ns: ClatNsOrLatNs;
    lat_ns: SlatNsOrLatNs;
    bw_min: number;
    bw_max: number;
    bw_agg: number;
    bw_mean: number;
    bw_dev: number;
    bw_samples: number;
    iops_min: number;
    iops_max: number;
    iops_mean: number;
    iops_stddev: number;
    iops_samples: number;
  }
  export interface SlatNsOrLatNs {
    min: number;
    max: number;
    mean: number;
    stddev: number;
  }
  export interface ClatNsOrLatNs {
    min: number;
    max: number;
    mean: number;
    stddev: number;
    percentile: Percentile;
  }
  export interface Percentile {
    "1.000000": number;
    "5.000000": number;
    "10.000000": number;
    "20.000000": number;
    "30.000000": number;
    "40.000000": number;
    "50.000000": number;
    "60.000000": number;
    "70.000000": number;
    "80.000000": number;
    "90.000000": number;
    "95.000000": number;
    "99.000000": number;
    "99.500000": number;
    "99.900000": number;
    "99.950000": number;
    "99.990000": number;
  }
  export interface Sync {
    lat_ns: ClatNsOrLatNs;
    total_ios: number;
  }
  export interface IodepthLevel {
    1: number;
    2: number;
    4: number;
    8: number;
    16: number;
    32: number;
    ">=64": number;
  }
  export interface IodepthSubmitOrIodepthComplete {
    0: number;
    4: number;
    8: number;
    16: number;
    32: number;
    64: number;
    ">=64": number;
  }
  export interface LatencyNsOrLatencyUs {
    2: number;
    4: number;
    10: number;
    20: number;
    50: number;
    100: number;
    250: number;
    500: number;
    750: number;
    1000: number;
  }
  export interface LatencyMs {
    "2": number;
    "4": number;
    "10": number;
    "20": number;
    "50": number;
    "100": number;
    "250": number;
    "500": number;
    "750": number;
    "1000": number;
    "2000": number;
    ">=2000": number;
  }
  export interface DiskUtilEntity {
    name: string;
    read_ios: number;
    write_ios: number;
    read_merges: number;
    write_merges: number;
    read_ticks: number;
    write_ticks: number;
    in_queue: number;
    util: number;
  }
  