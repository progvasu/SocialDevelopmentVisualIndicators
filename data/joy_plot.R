library(tidyverse)

df <- read_tsv("../Desktop/SocialDevelopmentVisualIndicators/data/age_ratio_joyplot_raw.tsv")

df %>%
  group_by(activity) %>% 
  filter(max(p) > 3e-04, # Keep the most popular ones
         !grepl('n\\.e\\.c', activity)) %>% # Remove n.e.c. (not elsewhere classified)
  arrange(time) %>%
  mutate(p_peak = p / max(p), # Normalize as percentage of peak popularity
         p_smooth = (lag(p_peak) + p_peak + lead(p_peak)) / 3, # Moving average
         p_smooth = coalesce(p_smooth, p_peak)) %>% # When there's no lag or lead, we get NA. Use the pointwise data
  ungroup() %>%
  do({ # 24:00:00 is missing from the source data; add for a complete cycle
    rbind(.,
          filter(., time == 0) %>%
            mutate(time = 24*60))
  }) %>%
  mutate(time = ifelse(time < 3 * 60, time + 24 * 60, time)) %>% # Set start of chart to 03:00; few things overlap this hour  
  mutate(activity = reorder(activity, p_peak, FUN=which.max)) %>% # order by peak time
  format_tsv() %>%
  write.table("../Desktop/SocialDevelopmentVisualIndicators/data/joyplot_test.tsv")  
